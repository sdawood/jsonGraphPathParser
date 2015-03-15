var parse = require('../index.js');
var assert = require('chai').assert

function pathsEqual(leftPath, rightPath) {
    assert.equal(JSON.stringify(leftPath), JSON.stringify(rightPath));
}
describe("#parse", function() {
    it('should parse JavaScript paths that combine identifiers and indexers', function() {
        var path = parse("genreLists[0][0].name");
        pathsEqual(path, ["genreLists", 0, 0, "name"]);
    });

    it('should parse JavaScript paths that combine identifiers, indexers, and string keys', function() {
        var path = parse("['genreLists'][0][0].name");
        pathsEqual(path, ["genreLists", 0, 0, "name"]);
    });

    it('should parse JavaScript paths that contain only indexers', function() {
        var path = parse('["genreLists"][0][0]["name"]');
        pathsEqual(path, ["genreLists", 0, 0, "name"]);
    });

    it('should parse JavaScript paths that contain only Identifiers', function() {
        var path = parse('genreLists.length');
        pathsEqual(path, ["genreLists", "length"]);
    });

    it('should parse apostrophe strings in indexers containing quotes', function() {
        var path = parse("['genre\"Lists'][0][0].name");
        pathsEqual(path, ['genre"Lists', 0, 0, "name"]);
    });

    it('should parse strings in indexers containing apostrophes', function() {
        var path = parse('["genre\'Lists"][0][0].name');
        pathsEqual(path, ["genre'Lists", 0, 0, "name"]);
    });

    it('should parse escaped quote in string', function() {
        var path = parse('["genre\\"Lists"][0][0].name');
        pathsEqual(path, ['genre"Lists', 0, 0, "name"]);
    });

    it('should parse escaped apostrophe in apostrophe string', function() {
        var path = parse("['genre\\'Lists'][0][0].name");
        pathsEqual(path, ["genre'Lists", 0, 0, "name"]);
    });

    it('should JavaScript keywords in indexer string', function() {
        var path = parse("['var'][0][0]['return']");
        pathsEqual(path, ['var', 0, 0, 'return']);
    });     

    it('should parse identifers that contain strange (but legal) characters (see https:\/\/mathiasbynens.be\/notes\/javascript-identifiers', function() {
        var path = parse('π.ಠ_ಠ.ლ_ಠ益ಠ_ლ.λ.\u006C\u006F\u006C\u0077\u0061\u0074.foo\u200Cbar.〱〱.price_9̶9̶_89.Ⅳ.$123._._0');
        pathsEqual(path, ['π','ಠ_ಠ','ლ_ಠ益ಠ_ლ','λ','\u006C\u006F\u006C\u0077\u0061\u0074','foo\u200Cbar','〱〱','price_9̶9̶_89','Ⅳ','$123','_','_0']);
    }); 

    it('should parse inclusive and exclusive ranges in indexers', function() {
        var path = parse("genreLists[0..1][0...1].name");
        pathsEqual(path, ["genreLists", {from: 0, to: 1}, {from:0, length:1-0}, "name"]);
    });     

    it('Should parse null key and should not coerce it into a string', function() {
        var path = parse("genreLists[null]");
        pathsEqual(path, ["genreLists", null]);
    });     


    it('Should parse indexers containing both ranges and keys', function() {
        var path = parse("genreLists[0...3, 1][0...3, 5, 6..9].name")
        pathsEqual(path, ["genreLists", [{from: 0, length: 3-0}, 1], [{from:0, length:3-1}, 5, {from:6, to: 9}], "name"]);
    });     

    it('Should parse path with only indexers, where some indexers contain both ranges and keys', function() {
        var path = parse("['genreLists'][0...3, 1][0...3, 5, 6..9]['name']")
        pathsEqual(path, ["genreLists", [{from: 0, length: 3-0}, 1], [{from:0, length:3-1}, 5, {from:6, to: 9}], "name"]);
    });     

    it('Should parse path with only indexers, where some indexers contain both ranges and keys and some contain only keys', function() {
        var path = parse("['genreLists'][0...3, 1][0...3, 5, 6..9]['name', 'rating']")
        pathsEqual(path, ["genreLists", [{from: 0, length: 3-0}, 1], [{from:0, length:3-1}, 5, {from:6, to: 9}], ["name", "rating"]]);
    });     

    it('Ranges can have smaller "to" values than "from" values. Technically this is illegal, but it is not the parser\'s job to enforce this restriction.', function() {
        var path = parse("genreLists[3...2]['name']")
        pathsEqual(path, ["genreLists", {from: 3, length: 2-3}, "name"]);
    });     

    it('should reject JavaScript keywords as identifiers', function() {
        var path = parse("var[0][0]");
    });     
});

/*


// ranges _can_ have from values that are larger than 'to' values. Although this _is_ invalid, it's not the parser's job to enforce this.
parse("genreLists[3...2]['name']")
// returns ["genreLists", {from: 3, to: 2}, "name"]

// arrays are not allowed inside of indexers
parse("genreLists[0...3, [1,2]][0...3, 5, 5..9]['name', 'rating']")
// throw "Unexpected token '[' found in indexer."

// ranges can only contain integers
parse("genreLists[0...3.2][0...3, 5, 5..9]['name', 'rating']")
// throw "Unexpected float found in range '3.2'"

// indentifiers cannot appear in indexers (outside of quotes)
parse("genreLists[hello][0].name")
// throw "Unexpected token found in range 'h'."

// ranges can only contain integers
parse("genreLists[0...'hello'][0...3, 5, 5..9]['name', 'rating']")
// throw "Unexpected token found in range 'h'"
```
*/