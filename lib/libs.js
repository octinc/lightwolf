var config = require('./config');

ret = {};

ret.query = require('./query').query;

ret.insert = require('./query').insert;

ret.checkUsername = function (username) {
    if (typeof (username) != 'string') return 0;
    if (username.length < 5 || username.length > 16) return 0;
    for (var i = 0; i < username.length; ++i) {
        c = username[i];
        if (c != '_' && (c < '0' || c > '9') && (c < 'a' || c > 'z')) return 0;
    }
    return 1;
}

ret.checkPassword = function (password) {
    if (typeof (password) != 'string') return 0;
    if (password.length != 64) return 0;
    return 1;
}

ret.randomString = function (len) {
    len = len || 32;
    var $chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var maxPos = $chars.length;
    var str = '';
    for (i = 0; i < len; i++) str += $chars.charAt(Math.floor(Math.random() * maxPos));
    return str;
}

exports = module.exports = ret;