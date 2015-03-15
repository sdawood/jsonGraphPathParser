# Falcor Path Syntax Parser

Falcor lets you represent all of your cloud data sources as one Virtual JSON Model on the server. On the client Falcor makes it appear as if the entire JSON model is available locally. Falcor retrieves any model data you request from the cloud on-demand, transparently handling all the network communication and keeping the server and client in sync.

Falcor allows developers to retrieve values from a JSON Model on the server using **Paths**. Falcor natively expresses Paths as an array of keys.

```JavaScript
model.getValue(["genreLists", 0, 0, "name"]).then(name => console.log(name)); // Prints "Die Hard"
```
This path is equivalent to a JavaScript path because identifiers after '.' are converted to hash lookups in JavaScript. In other words this...

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
Using an Array of keys to express a Path is straightforward. However when we gave some developers at ng-conf a sneak peek at Falcor in advance of our talk, the most common feedback we got was that the path syntax was hard to understand. To make Falcor more approachable we decided to add support for a JavaScript-like path syntax in a string.

```JavaScript
model.getValue("genreLists[0][0].name").then(name => console.log(name)); // Prints "Die Hard"
```

When I showed the same code examples using the path syntax developers immediately understood the core idea behind Falcor: **One Model Everywhere.**  Falcor allows you to access your application's JSON model the same way, regardless of whether the data is in the cloud or in-memory on the client. 

I set this repository up so that members of the community could help us with the Path Syntax parser.The task is simple, parse the path syntax into Falcor Paths (arrays of keys).

## Falcor Paths

Falcor Paths are just a Arrays of keys that can contain strings, numbers, booleans, null, or undefined. JSON Graph Paths can be used to retrieve values from a Falcor Model.

```JavaScript
var model = new falcor.Model({
  cache: {
    name: "John",
    age: 23,
    location: {
      country: "US",
      address: "233 Seaside",
      state: "CA"
    }
  }
});

model.
  getValue(["location", "country"]).
  then(country => console.log(country));
// prints "US" eventually
```
The Falcor Path Syntax is a string that is parsed into a Falcor Path.  Developers can use the path syntax to query the remote model using a familiar JavaScript-like syntax.

```JavaScript
var path = parse('location.name');
// returns ['location', 'name']
```

This parser will later be integrated directly into Falcor, allowing developers to write this:

```JavaScript
model.
  getValue("location.country").
  then(country => console.log(country));
// prints "US" eventually
```

Identifiers must be valid ES5 identifiers (see https://mathiasbynens.be/notes/javascript-identifiers for details). Values (null, false, true, undefined) are valid inside of indexers and should not be coerced to strings. All numbers must be valid JSON numbers. Values like null, true, false, and undefined can all be included in indexers and should not be converted to strings.

## Falcor PathSets

Falcor also allows multiple values to be requested from a model using **PathSet**s. **PathSet**s allow multiple keys or ranges in an indexer, and are a terse way of selecting multiple values from a Model.

```JavaScript
var model = new falcor.Model({
  cache: {
    name: "John",
    age: 23,
    location: {
      country: "US",
      address: "233 Seaside",
      state: "CA"
    }
  }
});

model.
  get(["location", ["country", "address"]]).
  then(json => console.log(JSON.stringify(json, null, 2));
// prints...
// {
//   "location": {
//     "country": "US",
//     "address": "233 Seaside"
//   }
// }
```

The following PathSet...
```JavaScript
["genreLists",{from:0, to:1},[{from:0,length:1}, 5], ["name", "rating"]]
```
...contains the following paths:
```JavaScript
["genreLists", 0, 0, "name"]
["genreLists", 0, 0, "rating"]
["genreLists", 0, 1, "name"]
["genreLists", 0, 1, "rating"]
["genreLists", 0, 5, "name"]
["genreLists", 0, 5, "rating"]
["genreLists", 1, 0, "name"]
["genreLists", 1, 0, "rating"]
["genreLists", 1, 1, "name"]
["genreLists", 1, 1, "rating"]
["genreLists", 1, 5, "name"]
["genreLists", 1, 5, "rating"]
````

We would like to add syntax for PathSet's as well. The PathSet above could be expressed like so using the PathSet syntax:

```JavaScript
var path = parse("genreLists[0..1][0...1, 5]['name', 'rating']")
// path is ["genreLists",{from:0, to:1},[{from:0,length:1}, 5], ["name", "rating"]]
```

The ranges with two '.' are inclusive. That means 0..2 translates to {from: 0, to:2}. The ranges with three '.' are exclusive. They should be translated to {from: 0, length: to-from}. For example 0...3 becomes {from:0, length: 2}. PathSets also allow multiple keys to be placed inside of indexers as in the example above (["name", "rating"]).

### Getting Started

**Want to help out with Falcor? This your chance!** We are currently driving hard to our release and we're looking for a little help writing the parser for this simple path syntax.  We are hoping to have an early preview of some Falcor development tools sometime next week, and this feature is one of the outstanding tasks. 

Fork the repo and have a look at index.js. At the moment it looks like this:

```JavaScript
function parse(path) {
  throw "Not Implemented.";
}

module.exports = parse;
```

Then run the unit tests with gulp.
```
gulp
```

Have a look at the unit tests (test/index.js), make them pass, and submit a pull request.

My recommendation is that you borrow identifier parse code and the JS string parse code from Esprima, and the JSON number parse code from a JSON parsing library. That should get you off the ground very quickly. Whereever possible we want to  minimize download size as well as maximize speed.

Thanks!
