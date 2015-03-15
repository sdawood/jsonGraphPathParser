# jsonGraphPathParser

```JavaScript

parseJsonGraphPath("genreLists[0][0].name") -> ["genreLists", 0, 0, "name"]

parseJsonGraphPath("genreLists[0..1][0..1].name") -> ["genreLists", {from: 0, to: 1}, {from:0, to:1}, "name"]

parseJsonGraphPath("genreLists[0...3][0...3].name") -> ["genreLists", {from: 0, to: 2}, {from:0, to:2}, "name"]

parseJsonGraphPath("genreLists[0...3, 1][0...3, 5, 6..9].name") -> ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], "name"]

parseJsonGraphPath("genreLists[0...3, 1][0...3, 5, 6..9]['name', 'rating']") -> ["genreLists", [{from: 0, to: 2}, 1], [{from:0, to:2}, 5, {from:6, to: 9}], ["name","rating"]]

parseJsonGraphPath("genreLists[0...3, [1,2]][0...3, 5, 5..9]['name', 'rating']") -> throw "Invalid Path. Unexpected token [1,2]."

parseJsonGraphPath("genreLists[0...3.2, [1,2]][0...3, 5, 5..9]['name', 'rating']") -> throw "Invalid Double in Range [0...3.2]"
