var fs = require('fs');
var PEG = require('pegjs');

var parser = require('./falcorpath');
module.exports = parser.parse