var jp = require('jsonpath');

/** Monkey patch jp replacing parser with falcorpath parser. Leaving handlers and other goodies untouched */

jp.parser.jpparse = jp.parser.parse;
jp.parser.parse = require('../lib/parser');
jp.handlers._fns['subscript-child-keyword_literal'] =
  jp.handlers._fns['member-child-identifier'];
module.exports = jp;