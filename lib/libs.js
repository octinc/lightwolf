var config = require('./config');

ret = {};

ret.query = require('./query').query;

ret.insert = require('./query').insert;

ret.checkUsername = function(username) {
    if (typeof(username) != 'string') return 0;
    if (username.length < 5 || username.length > 16) return 0;
    for (var i = 0; i < username.length; ++i) {
        c = username[i];
        if (c != '_' && (c < '0' || c > '9') && (c < 'a' || c > 'z')) return 0;
    }
    return 1;
}

ret.checkPassword = function(password) {
    if (typeof(password) != 'string') return 0;
    if (password.length != 64) return 0;
    return 1;
}

exports = module.exports = ret;