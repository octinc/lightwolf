var fs = require('fs');

config = JSON.parse(fs.readFileSync('./config.json'));

exports = module.exports = config;