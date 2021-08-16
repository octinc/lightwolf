User = {};

Sleep = async (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve(), ms);
    });
};

getCookie = () => {
    var cookie = {};
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim(), t = c.indexOf('=');
        cookie[c.substring(0, t)] = c.substring(t + 1, c.length);
    }
    return cookie;
};

httpGet = async (url, data) => {
    return new Promise((resolve, reject) => {
        $.get(url, data, (result) => {
            if (result.status != 200) throw new Error(result);
            resolve(result);
        })
    });
};

httpPost = async (url, data) => {
    return new Promise((resolve, reject) => {
        $.post(url, data, (result) => {
            if (result.status != 200) throw new Error(result);
            resolve(result);
        })
    });
};

getPwdsuf = async () => {
    return (await httpGet('/api/pwdsuf', {})).pwdsuf;
};

getUserinfo = async () => {
    return (await httpGet('/api/userinfo', {})).info;
};

Login = async (username, password, time) => {
    result = await httpPost('/api/login', {
        username: username,
        password: password,
        time: time
    });
    if (result.status != 200) throw result;
    if (result.check == 0) {
        $('form div').show();
        $('form div').empty();
        $('form div').append(result.message);
        return;
    }
    User = await getUserinfo();
    return toWating();
};

Register = async (username, password) => {
    result = await httpPost('/api/register', {
        username: username,
        password: password
    });
    if (result.status != 200) throw result;
    if (result.check == 0) {
        $('form div').show();
        $('form div').empty();
        $('form div').append(result.message);
        return;
    }
    User = await getUserinfo();
    return toWating();
};

ChangePassword = async (username, password, time, newpassword) => {
    result = await httpPost('/api/changepassword', {
        username: username,
        password: password,
        time: time,
        newpassword: newpassword
    });
    if (result.status != 200) throw result;
    if (result.check == 0) {
        $('form div').show();
        $('form div').empty();
        $('form div').append(result.message);
        return;
    }
    User = await getUserinfo();
    return toWating();
};

Logout = async () => {
    await httpGet('/api/logout', {});
};

toLogin = async () => {
    $('body').empty();
    $('body').append('<h2>登录/注册</h2>');
    $('body').append('<form></form>');
    $('form').append('用户名：<input type="text" id="username" /><br />');
    $('form').append('密码：<input type="password" id="password" /><br />');
    $('form').append('<div style="color:red">Message</div>');
    $('form div').hide();
    $('form').append('<button type="button" id="but"> 登录 </button>');
    $('form').append('<button type="button" id="reg"> 注册 </button>');
    pwdsuf = await getPwdsuf();
    $('form button#but').click(async () => {
        username = $('form #username').val();
        password = $('form #password').val();
        time = (new Date()).getTime();
        password = sha3_256(password + pwdsuf);
        password = sha3_256(password + time);
        Login(username, password, time);
    });
    $('form button#reg').click(async () => {
        username = $('form #username').val();
        password = $('form #password').val();
        password = sha3_256(password + pwdsuf);
        Register(username, password);
    });
};

toChangePassword = async () => {
    $('body').empty();
    $('body').append('<h2>修改密码</h2>');
    $('body').append('<form></form>');
    $('form').append('原密码：<input type="password" id="password1" /><br />');
    $('form').append('新密码：<input type="password" id="password2" /><br />');
    $('form').append('确认密码：<input type="password" id="password3" /><br />');
    $('form').append('<div style="color:red">Message</div>');
    $('form div').hide();
    $('form').append('<button type="button" id="cha"> 修改 </button>');
    $('body').append('<span style="text-decoration:underline;color:blue" id="back">返回</span>')
    pwdsuf = await getPwdsuf();
    $('#cha').click(async () => {
        username = User.username;
        password = $('form #password1').val();
        newpassword = $('form #password2').val();
        repassword = $('form #password3').val();
        if (newpassword != repassword) {
            $('form div').show();
            $('form div').empty();
            $('form div').append("两次输入的密码不相同");
            return;
        }
        time = (new Date()).getTime();
        password = sha3_256(password + pwdsuf);
        password = sha3_256(password + time);
        newpassword = sha3_256(newpassword + pwdsuf);
        ChangePassword(username, password, time, newpassword);
    });
    $('#back').click(() => { toWating(); })
};

toWaitingGrant = () => {
    $('body').empty();
    $('body').append('<h2>您的账号尚未认证</h2>');
    $('body').append('<p> 请联系管理员 keywet06 并等待认证 </h2>');
    $('body').append('<button type="button" id="but">登出</button>');
    $('body').append('<span style="text-decoration:underline;color:blue" id="cha">修改密码</span>')
    $('body button').click(async () => {
        await Logout();
        return toLogin();
    });
    $('#cha').click(() => { toChangePassword(); });
}

var toWating;

// Game (WebSocket Based) begin

var socket;

var Game = {
    ready: 0,
    people: 0,
    isready: 0,
    identity: ''
};

gameStart = (data) => {
    Game.identity = data.identity;
    
};

joinGame = () => {
    $('body').empty();
    $('body').append('<h3>等待室 </h3>');
    $('body').append('<p>现在有 <span id="num1">0</span>/<span id="num2">0</span> 人已就绪</p>');
    $('body').append('<button type="button" id="ready">准备</ready>')
    $('body').append('<button type="button" id="leave">离开</button>');;
    socket = io.connect();
    $('#ready').click(() => {
        if (Game.isready != 1) {
            Game.isready = 1;
            $('#ready').empty().append('取消');
            socket.emit('ready', {});
        } else {
            Game.isready = 0;
            $('#ready').empty().append('准备');
            socket.emit('unready', {});
        }
    });
    $('#leave').click(() => {
        socket.disconnect();
        toWating();
    });
    socket.on('tologin', (data) => {
        console.log(data);
        Game.ready = data.ready;
        Game.people = data.people;
        $("#num1").empty().append(`${Game.ready}`);
        $("#num2").empty().append(`${Game.people}`);
        console.log({
            socketid: User.socketid,
            username: User.username
        });
        socket.emit('login', {
            socketid: User.socketid,
            username: User.username
        });
    });
    socket.on('join', () => {
        ++Game.people;
        $("#num2").empty().append(`${Game.people}`);
    });
    socket.on('leave', () => {
        --Game.people;
        $("#num2").empty().append(`${Game.people}`);
    });
    socket.on('ready', () => {
        ++Game.ready;
        $("#num1").empty().append(`${Game.ready}`);
    });
    socket.on('unready', () => {
        --Game.ready;
        $("#num1").empty().append(`${Game.ready}`);
    });
    socket.on('gamestart', (data) => {
        gameStart(data);
    });
    socket.on('disconnect', () => {
        toWating();
    });
    socket.on('err', (data) => {
        $('body').empty().append(data.message);
    });
};

// Game end

toWating = () => {
    if (!User.granted) return toWaitingGrant();
    $('body').empty();
    $('body').append('<h2>用户操作</h2>');
    $('body').append('<button type="button" id="join">加入游戏</button>');
    // $('body').append('<p>当前 <span id="pnum"> 0 </span> 人</h2>');
    $('body').append('<button type="button" id="but">登出</button>');
    $('body').append('<span style="text-decoration:underline;color:blue" id="cha">修改密码</span>')
    $('#but').click(async () => {
        await Logout();
        return toLogin();
    });
    $('#cha').click(() => { toChangePassword(); });
    $('#join').click(() => { joinGame(); });
}

$(document).ready(async () => {

    User = await getUserinfo();
    if (!User.login) { toLogin(); return; }
    toWating();

});
