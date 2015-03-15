# jsonGraphPathParser

JSON Graph Path Syntax allows developers using JSON Graph Path to specify paths in the familiar JavaScript style.  All identifiers (a.b.c) must adhere to JavaScript's identifier rules. All numbers in indexers must be valid JSON numbers.

```JavaScript

parseJsonGraphPath("genreLists[0][0].name") -> ["genreLists", 0, 0, "name"]

parseJsonGraphPath("genreLists[0..1][0..1].name") -> ["genreLists", {from: 0, to: 1}, {from:0, to:1}, "name"]

parseJsonGraphPath("genreLists[0...3][0...3].name") -> ["genreLists", {from: 0, to: 2}, {from:0, to:2}, "name"]

parseJsonGraphPath("genreLists[0...3, 1][0...3, 5, 6..9].name") -> ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], "name"]

parseJsonGraphPath("genreLists[0...3, 1][0...3, 5, 6..9]['name', 'rating']") -> ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], ["name","rating"]]

parseJsonGraphPath("genreLists[0...3, [1,2]][0...3, 5, 5..9]['name', 'rating']") -> throw "Invalid Path. Unexpected token [1,2] found in indexer."

parseJsonGraphPath("genreLists[0...3.2, [1,2]][0...3, 5, 5..9]['name', 'rating']") -> throw "Only integers are allowed in ranges [0...3.2]"
