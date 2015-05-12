var jp = require('jsonpath');

/** Monkey patch jp replacing parser with falcorpath parser. Leaving handlers and other goodies untouched */

jp.parser.jpparse = jp.parser.parse;
jp.parser.parse = require('../lib/parser');

module.exports = jp;