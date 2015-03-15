# JSON Graph Path Syntax Parser

Falcor lets you represent all of your cloud data sources as one Virtual JSON Model on the server. On the client Falcor makes it appear as if the entire JSON model is available locally. Falcor retrieves any model data you request from the cloud on-demand, transparently handling all the network communication and keeping the server and client in sync.

Falcor allows developers to retrieve data from JSON Model on the server using **Paths**. Falcor natively expresses Paths as an array of keys.

```JavaScript
model.getValue(["genreLists", 0, 0, "name"]).then(name => console.log(name)); // Prints "Die Hard"
```
This makes sense because identifiers in JavaScript are converted to hash lookups. In other words this...

```JavaScript
model.genreLists[0][0].name
```
...is equivalent to...
```JavaScript
model["genreLists"][0][0]["name"]
```
...which is a short jump to Falcor's path syntax:
```JavaScript
model.getValue(["genreLists", 0, 0, "name"]);
```
Using an Arrays of keys to express a Path is straightforward. However when I gave some developers at ng-conf a sneak peek at Falcor in advance of my talk, the most common feedback I got was that the path syntax was hard to understand. To make Falcor more approachable I decided to add support for a JavaScript-like path syntax in a string.

```JavaScript
model.getValue("genreLists[0][0].name").then(name => console.log(name)); // Prints "Die Hard"
```
When I showed the same code examples using the JavaScript path syntax syntax, developers immediately understood one of the core ideas behind Falcor: **access your JSON data the same way everywhere, no matter whether it is.**

**Want to help out with Falcor. This your chance!** We are currently driving hard to our release and we're looking for a little help writing the parser for this simple path syntax.  We are hoping to have an early preview of some Falcor development tools sometime next week, and this feature is one of the outstanding tasks. Just fork, implement the parse method, run the unit tests, and if they pass, submit a pull request!

## JSON Graph Path Syntax

JSON Graph Path Syntax allows developers to specify Falcor paths using the familiar JavaScript style. PathSets are also supported. PathSets allow multiple paths can be specified in one expression by specifying 0 or more keys or ranges inside of an indexer.

### Unit Tests

```JavaScript

var parse = function(pathSyntax) {
  var path = [];
  // your code goes here
  return path;
}

parse("genreLists[0][0].name") 
// returns["genreLists", 0, 0, "name"]

parse("['genreLists'][0][0].name") 
// returns ["genreLists", 0, 0, "name"]

parse('["genreLists"][0][0]["name"]'])
// returns ["genreLists", 0, 0, "name"]

// escaped quotes must be supported in strings
parse('["genre\"Lists"][0][0]["name"]'])
// returns ['genre"Lists', 0, 0, "name"]

parse("genreLists[0..1][0..1].name")
// returns ["genreLists", {from: 0, to: 1}, {from:0, to:1}, "name"]

parse("genreLists[0...3][0...3].name")
// returns ["genreLists", {from: 0, to: 2}, {from:0, to:2}, "name"]

// note that null is a valid key and is _not_ coerced into a string
parse("genreLists[null]")
// returns ["genreLists", null] 

parse("genreLists[0...3, 1][0...3, 5, 6..9].name")
// returns ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], "name"]

parse("genreLists[0...3, 1][0...3, 5, 6..9].name")
// returns ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], "name"]

parse("genreLists[0...3, 1][0...3, 5, 6..9]['name', 'rating']")
// returns ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], ["name","rating"]]

parse("genreLists[-1...3, 1][0...3, 5, 6..9]['name', 'rating']")
// returns ["genreLists", [{from: -1, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], ["name","rating"]]

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
