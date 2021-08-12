User = {};

Sleep = async function (ms) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve(), ms);
    });
};

getCookie = function () {
    var cookie = {};
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim(), t = c.indexOf('=');
        cookie[c.substring(0, t)] = c.substring(t + 1, c.length);
    }
    return cookie;
};

httpGet = async function (url, data) {
    return new Promise(function (resolve, reject) {
        $.get(url, data, function (result) {
            if (result.status != 200) throw new Error(result);
            resolve(result);
        })
    });
};

httpPost = async function (url, data) {
    return new Promise(function (resolve, reject) {
        $.post(url, data, function (result) {
            if (result.status != 200) throw new Error(result);
            resolve(result);
        })
    });
};

getPwdsuf = async function () {
    return (await httpGet('/api/pwdsuf', {})).pwdsuf;
};

getUserinfo = async function () {
    return (await httpGet('/api/userinfo', {})).info;
};

Login = async function (username, password, time) {
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

Register = async function (username, password) {
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

Logout = async function () {
    await httpGet('/api/logout', {});
};

toLogin = async function () {
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
    $('form button#but').click(async function () {
        username = $('form #username').val();
        password = $('form #password').val();
        time = (new Date()).getTime();
        password = sha3_256(password + pwdsuf);
        password = sha3_256(password + time);
        Login(username, password, time);
    });
    $('form button#reg').click(async function () {
        username = $('form #username').val();
        password = $('form #password').val();
        password = sha3_256(password + pwdsuf);
        Register(username, password);
    });
};

toWaitingGrant = function () {
    $('body').empty();
    $('body').append('<h2>您的账号尚未认证</h2>');
    $('body').append('<p> 请联系管理员 keywet06 并等待认证 </h2>');
    $('body').append('<button type="button" id="but">登出</button>');
    $('body button').click(async function () {
        await Logout();
        return toLogin();
    });
}

toWating = function () {
    if (!User.granted) {
        return toWaitingGrant();
    }
    $('body').empty();
    $('body').append('<h2>等待室</h2>');
    $('body').append('<p>当前 <span id="pnum"> 0 </span> 人</h2>');
    $('body').append('<button type="button" id="but">登出</button>');
    $('body button').click(async function () {
        await Logout();
        return toLogin();
    });
}

$(document).ready(async function () {

    User = await getUserinfo();
    if (!User.login) { toLogin(); return; }
    toWating();

});