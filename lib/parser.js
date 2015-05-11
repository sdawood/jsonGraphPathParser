var fs = require('fs');
var ASTY    = require("asty")
var PEG     = require("pegjs")
var PEGUtil = require("pegjs-util")
var asty = new ASTY();

var parser = PEG.buildParser(fs.readFileSync("./lib/falcorpathplus.pegjs", "utf8"));

var parse = function(path) {
  var result = PEGUtil.parse(parser, path, {
    startRule: "start",
    makeAST: function (line, column, offset, args) {
      return asty.create.apply(asty, args).pos(line, column, offset)
    }
  })
  return result;
}

module.exports = parse