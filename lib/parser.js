var fs = require('fs');
var ASTY    = require("asty")
var PEG     = require("pegjs")
var PEGUtil = require("pegjs-util")
var asty = new ASTY();
var parser = require('./falcorpathplus');
//var parser = PEG.buildParser(fs.readFileSync("./lib/falcorpathplus.pegjs", "utf8"));
function jsonpathAST(falcorpathPlus) {
  var ast = [];
  falcorpathPlus.ast.walk(function(node, depth, parent, when) { if(parent) { ast.push(node.A); } });
  return ast;
}

var parse = function(path) {
  var astyResult = PEGUtil.parse(parser, path, {
    startRule: "start",
    makeAST: function (line, column, offset, args) {
      return asty.create.apply(asty, args).pos(line, column, offset)
    }
  })
  if (astyResult.error) {
    throw Error(astyResult.error.message);
  }
  var ast = jsonpathAST(astyResult);
  /** Preprocess to neutralize jsonpath/lib/index.js
   * // index:110
   * var partials = [ { path: ['$'], value: obj } ];
   * // index:113
   * if (path.length && path[0].expression.type == 'root') path.shift();
   */
  if (ast.length && ast[0].expression.value == '$') ast.shift();
  return ast;
}

module.exports = parse