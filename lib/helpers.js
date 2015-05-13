var _ = require('lodash');
var jp = require('jsonpath');

function jsonpathAST(falcorpathPlus) {
  return falcorpathPlus.ast.map(function(node) {
     return node.A;
  });
}

function falcorPath(falcorpathPlus) {
  var ast = falcorpathPlus;
  return ast.map(function(node) {
    var value = node.expression.value;
    /**
     * subscript expression nesting is not allowed beyond one level in both jsonpath and falcor, a simple one level mapping works here.
     */
    if (_.isArray(value)) {
      return _.map(value, (function(node) { return node.expression.value; }));
    }
    return value
  });
}

function fixGaps(falcorPath) {
  var jsonpath_gap_leading_subscript = falcorPath.original.charAt(0) ==="[";
  var original = jsonpath_gap_leading_subscript ? '$' + falcorPath.original : falcorPath.original; //jsonpath doesn't allow leading subscript
  original = original.replace(/\s*/g, '').replace(/\.\.\./g, "..").replace(/\.\./g, ':')
  var jpAST = jp.parser.jpparse(original);
  if (jsonpath_gap_leading_subscript) jpAST.shift();

  /**
   * By design falcor parser is expected to produce escape sequences different from jsonpath parser implementation
   * jsonpath.parser keeps the double escaped quote as-is inside of a string, while falcor.parser is expected to return a string containing single escaped quote
   * inpuet: '["genre\\"Lists"][0][0].name'
   * jsonpath AST contains: 'genre\\"Lists'
   * falcorpath AST contains: 'genre"Lists'
  */

  return jpAST.map(function(node) {
    node.expression.value = (typeof node.expression.value === 'string' ? node.expression.value.replace(/\\"/g, '"') : node.expression.value );
    node.expression.value = (typeof node.expression.value === 'string' ? node.expression.value.replace(/\\'/g, "'") : node.expression.value );
    return node;
  });
}

module.exports = {
  jsonpathAST: jsonpathAST,
  falcorPath: falcorPath,
  fixGaps: fixGaps
}