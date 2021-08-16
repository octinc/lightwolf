var express = require('express');
var cookiePraser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var sha = require('js-sha3').sha3_256;

var libs = require('./lib/libs');
var config = require('./config.json');

var app = express();

var UserInfo = {};
var UserSocketid = {};

app.use(cookiePraser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(config.session));

app.use('/public', express.static('public'));

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/pwdsuf', (req, res) => {
    res.send({
        status: 200,
        check: 1,
        message: "Okay",
        pwdsuf: config.sha.suf
    });
});

app.get('/api/userinfo', (req, res) => {
    if (req.session.username != undefined || req.session.username != null) {
        res.send({
            status: 200,
            check: 1,
            message: "Okay",
            info: {
                login: 1,
                username: req.session.username,
                granted: req.session.granted,
                socketid: UserSocketid[req.session.username]
            }
        });
    } else {
        res.send({
            status: 200,
            check: 1,
            message: "Okay",
            info: {
                login: 0
            }
        });
    }
})

app.post('/api/login', async (req, res) => {
    data = req.body;
    if (typeof (data) != 'object') data = {};
    if (!libs.checkUsername(data.username)) {
        res.send({
            status: 200,
            check: 0,
            message: "Username wrong"
        });
        return;
    }
    timen = parseInt(data.time);
    if (timen == undefined || isNaN(timen) || timen < 0) {
        res.send({
            status: 200,
            check: 0,
            message: "Date should be an unsigned number"
        });
        return;
    }
    if (Math.abs((new Date()).getDate - timen) > 600) {
        res.send({
            status: 200,
            check: 0,
            message: "The time you gave is too far from server's date"
        });
        return;
    }
    result = await libs.query("SELECT * FROM user WHERE ?", {
        name: data.username
    });
    if (result.length == 0) {
        res.send({
            status: 200,
            check: 0,
            message: "User not found"
        });
        return;
    }
    col = result[0];
    if (sha(col.password + timen) != data.password) {
        res.send({
            status: 200,
            check: 0,
            message: "Password wrong"
        });
        return;
    }
    req.session.username = data.username;
    req.session.granted = col.granted;
    UserSocketid[data.username] = libs.randomString(16);
    UserInfo[UserSocketid[data.username]] = { username: data.username };
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
    return;
});

app.post('/api/register', async (req, res) => {
    data = req.body;
    if (typeof (data) != 'object') data = {};
    if (!libs.checkUsername(data.username)) {
        res.send({
            status: 200,
            check: 0,
            message: "Username wrong"
        });
        return;
    }
    if (!libs.checkPassword(data.password)) {
        res.send({
            status: 200,
            check: 0,
            message: "Password wrong"
        });
        return;
    }
    result = await libs.query("SELECT * FROM user WHERE ?", {
        name: data.username
    });
    if (result.length > 0) {
        res.send({
            status: 200,
            check: 0,
            message: "User is already exists"
        });
        return;
    }
    await libs.insert('user', {
        name: data.username,
        password: data.password,
        granted: 0
    });
    req.session.username = data.username;
    req.session.granted = col.granted;
    UserSocketid[data.username] = libs.randomString(16);
    UserInfo[UserSocketid[data.username]] = {
        username: data.username
    };
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
    return;
});

app.post('/api/changepassword', async (req, res) => {
    data = req.body;
    if (typeof (data) != 'object') data = {};
    if (!libs.checkUsername(data.username)) {
        res.send({
            status: 200,
            check: 0,
            message: "Username wrong"
        });
        return;
    }
    if (!libs.checkPassword(data.newpassword)) {
        res.send({
            status: 200,
            check: 0,
            message: "New password wrong"
        });
        return;
    }
    timen = parseInt(data.time);
    if (timen == undefined || isNaN(timen) || timen < 0) {
        res.send({
            status: 200,
            check: 0,
            message: "Date should be an unsigned number"
        });
        return;
    }
    if (Math.abs((new Date()).getDate - timen) > 600) {
        res.send({
            status: 200,
            check: 0,
            message: "The time you gave is too far from server's date"
        });
        return;
    }
    result = await libs.query("SELECT * FROM user WHERE ?", {
        name: data.username
    });
    if (result.length == 0) {
        res.send({
            status: 200,
            check: 0,
            message: "User not found"
        });
        return;
    }
    col = result[0];
    if (sha(col.password + timen) != data.password) {
        res.send({
            status: 200,
            check: 0,
            message: "Password wrong"
        });
        return;
    }
    await libs.query(`UPDATE user SET password='${data.newpassword}' WHERE name='${data.username}'`);
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
    return;
});

app.get('/api/logout', async (req, res) => {
    UserInfo[UserSocketid[req.session.username]] = undefined;
    UserSocketid[req.session.username] = undefined;
    req.session.destroy();
    res.clearCookie();
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
});

// Game (WebSocket Based) begin

const server = require('http').createServer(app);
const io = require('socket.io')(server);

var Game = {
    UserList: {},
    WolfList: {},
    ready: 0,
    people: 0
};

gameStart = () => {
    console.log(Game.UserList);
};

io.on('connection', (socket) => {
    User = {
        ready: 0,
        username: '',
        socketid: '',
        socket: {}
    };
    socket.emit('tologin', {
        ready: Game.ready,
        people: Game.people
    });
    socket.on('login', (data) => {
        if (typeof (data) != 'object') data = {};
        if (typeof (UserInfo[data.socketid]) != 'object') {
            socket.emit('err', {
                message: "socketid 不存在"
            });
            return;
        }
        if (UserInfo[data.socketid].username != data.username) {
            socket.emit('err', {
                message: "用户名与 socketid 不符"
            });
            return;
        }
        if (Game.UserList[User.username] != undefined) {
            socket.emit('err', {
                message: "你已经进入房间，不能多次进入"
            });
            return;
        }
        if (!User.username) ++Game.people, io.emit('join');
        User.username = data.username;
        User.socketid = data.socketid;
        User.socket = socket;
        Game.UserList[User.username] = User;
    });
    socket.on('ready', () => {
        User.ready = 1, ++Game.ready, io.emit('ready');
        if (Game.ready == Game.people && Game.ready >= 3) gameStart();
    });
    socket.on('unready', () => {
        User.ready = 0, --Game.ready, io.emit('unready');
    });
    socket.on('disconnect', () => {
        if (!User.username) return;
        Game.UserList[User.username] = undefined;
        --Game.people, io.emit('leave');
        if (!User.ready) return;
        --Game.ready, io.emit('unready');
    });
});

// Game end

server.listen(config.port, () => {
    console.log(`App listening at http://localhost:${config.port}`);
});

