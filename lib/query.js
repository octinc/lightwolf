var fs = require('fs');
var mysql = require('mysql');

var config = require('./config');

var sql = mysql.createConnection(config.database);

sql.connect();

ret = {};

ret.query = function (str, obj) {
    return new Promise(function (resolve, reject) {
        sql.query(str, obj, function (err, result) {
            if (err) { resolve([]); throw err; }
            resolve(result);
        });
    });
};

ret.insert = function (table, obj) {
    return new Promise(function (resolve, reject) {
        str = `INSERT INTO ${table} (`
        c = 0;
        for (var key in obj) {
            if (c) str = str + ', ';
            c = 1, str = str + key;
        }
        str = str + ') VALUES ('
        c = 0;
        for (var key in obj) {
            if (c) str = str + ', ';
            c = 1;
            if (typeof(obj[key]) == 'string') {
                str = str + `'${obj[key]}'`;
            } else {
                str = str + obj[key];
            }
        }
        str = str + ')';
        sql.query(str, {}, function (err, result) {
            if (err) { resolve([]); throw err; }
            resolve(result);
        });
    });
};

module.exports = ret;
