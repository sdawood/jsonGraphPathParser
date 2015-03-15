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
When I showed the same code examples using the JavaScript path syntax syntax, developers immediately understood one of the core ideas behind Falcor: **One Model Everywhere.**  Falcor allows you to access your application's JSON model the same way, regardless of whether the data is in the cloud or in-memory on the client.

## JSON Graph Path Syntax

JSON Graph Path Syntax allows developers to specify Falcor paths using the familiar JavaScript style. 

```JavaScript
model.getValue('genreLists[0][0].name');
```

**PathSet**s are also supported. PathSets allow multiple paths can be specified in one expression.  Indexers in PathSet syntax expressions may contain multiple ranges or keys.

As an example the following PathSet...
```JavaScript
// note the first range (0..1) is inclusive because it has two '.' characters.
// the second range is (0...2) is exclusive because it has three '.' characters.
genreLists[0..1][0...2, 5]['name', 'rating'] 
```
...contains the following paths:
```JavaScript
genreLists[0][0].name
genreLists[0][0].rating
genreLists[0][1].name
genreLists[0][1].rating
genreLists[0][5].name
genreLists[0][5].rating
genreLists[1][0].name
genreLists[1][0].rating
genreLists[1][1].name
genreLists[1][1].rating
genreLists[1][5].name
genreLists[1][5].rating
````
The Path Syntax is parsed into a Path object, and the PathSet Syntax is parsed into a PathSet object. 

The following PathSet syntax...

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

Thanks!
