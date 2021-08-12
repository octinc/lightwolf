var express = require('express');
var cookiePraser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var sha = require('js-sha3').sha3_256;

var libs = require('./lib/libs');
var config = require('./config.json');

var app = express();

app.use(cookiePraser());
app.use(bodyParser.urlencoded({extended: false}));
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
                granted: req.session.granted
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
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
    return;
});

app.get('/api/logout', async (req, res) => {
    req.session.destroy();
    res.clearCookie();
    res.send({
        status: 200,
        check: 1,
        message: "Success"
    });
});

app.listen(config.port, () => {
    console.log(`App listening at http://localhost:${config.port}`);
});

