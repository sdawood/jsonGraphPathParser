var assert = require('chai').assert;
var expect = require('chai').expect;
var jp = require('jsonpath');

/** Monkey patch jp replacing parser with falcorpath parser. Leaving handlers and other goodies untouched */
jp.parser = { parse: require('../lib/parser')};

/** Shims for filter and script expressions */
var aesprim = require('../node_modules/jsonpath/lib/aesprim');
var _evaluate = require('../node_modules/jsonpath/node_modules/static-eval');
function evaluate() {
  try { return _evaluate.apply(this, arguments) }
  catch (e) { }
}

var data = require('./data/store.json');

var subscript_child_filter_expression = function(filterExpression) {

  // slice out the expression from ?(expression)
  var src = filterExpression.slice(2, -1);
  var ast = aesprim.parse(src).body[0].expression;

  var passable = function (node) {
    return evaluate(ast, { '@': node.value });
  };
  return passable;
}

var subscript_child_script_expression = function(scriptExpression, partial) {
var src = scriptExpression.slice(1, -1);
  var ast = aesprim.parse(src).body[0].expression;
  return evaluate(ast, { '@': partial });
}

describe('query', function() {

  it('first-level member', function() {
    var results = jp.nodes(data, '$.store');
    assert.deepEqual(results, [ { path: ['$', 'store'], value: data.store } ]);
  });

  it('authors of all books in the store', function() {
//    var results = jp.nodes(data, '$.store.book[*].author');
    var results = jp.nodes(data, '$.store.book[0...4].author');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'author'], value: 'Nigel Rees' },
      { path: ['$', 'store', 'book', 1, 'author'], value: 'Evelyn Waugh' },
      { path: ['$', 'store', 'book', 2, 'author'], value: 'Herman Melville' },
      { path: ['$', 'store', 'book', 3, 'author'], value: 'J. R. R. Tolkien' }
    ]);
  });

  it('all authors', function() {
//    var results = jp.nodes(data, '$..author');
    var results = jp.nodes(data, '$.store.book[0,1,2,3].author');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'author'], value: 'Nigel Rees' },
      { path: ['$', 'store', 'book', 1, 'author'], value: 'Evelyn Waugh' },
      { path: ['$', 'store', 'book', 2, 'author'], value: 'Herman Melville' },
      { path: ['$', 'store', 'book', 3, 'author'], value: 'J. R. R. Tolkien' }
    ]);
  });

  it('all things in store', function() {
    var results = jp.nodes(data, '$.store["book", "bicycle"]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book'], value: data.store.book },
      { path: ['$', 'store', 'bicycle'], value: data.store.bicycle }
    ]);
  });

  it('price of everything in the store', function() {
//    var results = jp.nodes(data, '$.store..price');
    var bookPrices = jp.nodes(data, '$.store.book[0...4].price');
    var bicyclePrice = jp.nodes(data, '$.store.bicycle.price');
    var results = bookPrices.concat(bicyclePrice);
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0, 'price'], value: 8.95 },
      { path: ['$', 'store', 'book', 1, 'price'], value: 12.99 },
      { path: ['$', 'store', 'book', 2, 'price'], value: 8.99 },
      { path: ['$', 'store', 'book', 3, 'price'], value: 22.99 },
      { path: ['$', 'store', 'bicycle', 'price'], value: 19.95 }
    ]);
  });

  it('last book in order via expression', function() {
//    var results = jp.nodes(data, '$..book[(@.length-1)]');
    /** It kinda sucks to have to eagerly evaluate your subscript expressions, using access to the data to figure out the index of the last item*/
    var results = jp.nodes(data, '$.store.book[' + (subscript_child_script_expression("(@.length-1)", data.store.book)) + ']');
    assert.deepEqual(results, [ { path: ['$', 'store', 'book', 3], value: data.store.book[3] }]);
  });

  it('first two books via union', function() {
//    var results = jp.nodes(data, '$..book[0,1]');
    var results = jp.nodes(data, '$.store.book[0,1]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 1], value: data.store.book[1] }
    ]);
  });

  it('first two books via slice', function() {
//    var results = jp.nodes(data, '$..book[0:2]');
    var results = jp.nodes(data, '$.store.book[0..2]');
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 1], value: data.store.book[1] }
    ]);
  });

  it('filter all books with isbn number', function() {
//    var results = jp.nodes(data, '$..book[?(@.isbn)]');
    var results = jp.nodes(data, '$.store.book[0...4]');
    var passable = subscript_child_filter_expression('?(@.isbn)');
    results = results.filter(passable)
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 2], value: data.store.book[2] },
      { path: ['$', 'store', 'book', 3], value: data.store.book[3] }
    ]);
  });

  it('filter all books with a price less than 10', function() {
//    var results = jp.nodes(data, '$..book[?(@.price<10)]');
    var results = jp.nodes(data, '$.store.book[0...4]');
    passable = subscript_child_filter_expression('?(@.price<10)');
    results = results.filter(passable);
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', 0], value: data.store.book[0] },
      { path: ['$', 'store', 'book', 2], value: data.store.book[2] }
    ]);
  });

  /** Nope, select all queries offends falcor */
//  it('all elements', function() {
//    var results = jp.nodes(data, '$..*');
//
//    assert.deepEqual(results, [
//      { path: [ '$', 'store' ], value: data.store },
//      { path: [ '$', 'store', 'book' ], value: data.store.book },
//      { path: [ '$', 'store', 'bicycle' ], value: data.store.bicycle },
//      { path: [ '$', 'store', 'book', 0 ], value: data.store.book[0] },
//      { path: [ '$', 'store', 'book', 1 ], value: data.store.book[1] },
//      { path: [ '$', 'store', 'book', 2 ], value: data.store.book[2] },
//      { path: [ '$', 'store', 'book', 3 ], value: data.store.book[3] },
//      { path: [ '$', 'store', 'book', 0, 'category' ], value: 'reference' },
//      { path: [ '$', 'store', 'book', 0, 'author' ], value: 'Nigel Rees' },
//      { path: [ '$', 'store', 'book', 0, 'title' ], value: 'Sayings of the Century' },
//      { path: [ '$', 'store', 'book', 0, 'price' ], value: 8.95 },
//      { path: [ '$', 'store', 'book', 1, 'category' ], value: 'fiction' },
//      { path: [ '$', 'store', 'book', 1, 'author' ], value: 'Evelyn Waugh' },
//      { path: [ '$', 'store', 'book', 1, 'title' ], value: 'Sword of Honour' },
//      { path: [ '$', 'store', 'book', 1, 'price' ], value: 12.99 },
//      { path: [ '$', 'store', 'book', 2, 'category' ], value: 'fiction' },
//      { path: [ '$', 'store', 'book', 2, 'author' ], value: 'Herman Melville' },
//      { path: [ '$', 'store', 'book', 2, 'title' ], value: 'Moby Dick' },
//      { path: [ '$', 'store', 'book', 2, 'isbn' ], value: '0-553-21311-3' },
//      { path: [ '$', 'store', 'book', 2, 'price' ], value: 8.99 },
//      { path: [ '$', 'store', 'book', 3, 'category' ], value: 'fiction' },
//      { path: [ '$', 'store', 'book', 3, 'author' ], value: 'J. R. R. Tolkien' },
//      { path: [ '$', 'store', 'book', 3, 'title' ], value: 'The Lord of the Rings' },
//      { path: [ '$', 'store', 'book', 3, 'isbn' ], value: '0-395-19395-8' },
//      { path: [ '$', 'store', 'book', 3, 'price' ], value: 22.99 },
//      { path: [ '$', 'store', 'bicycle', 'color' ], value: 'red' },
//      { path: [ '$', 'store', 'bicycle', 'price' ], value: 19.95 }
//    ]);
//  });

//  it('all elements via subscript wildcard', function() {
//    var results = jp.nodes(data, '$..*');
//    assert.deepEqual(jp.nodes(data, '$..[*]'), jp.nodes(data, '$..*'));
//  });

  it('object subscript wildcard', function() {
//    var results = jp.query(data, '$.store[*]');
    var results = jp.query(data, '$.store["book", "biscyle"]'); // Wildcard is for wildcards, not classy cacheable falcor
    assert.deepEqual(results, [ data.store.book, data.store.bicycle ]);
  });

  it('no match returns empty array', function() {
//    var results = jp.nodes(data, '$..bookz');
    var results = jp.nodes(data, '$.store.bookz');
    assert.deepEqual(results, []);
  });

  it('member numeric literal gets first element', function() {
    var results = jp.nodes(data, '$.store.book.0');
    assert.deepEqual(results, [ { path: [ '$', 'store', 'book', 0 ], value: data.store.book[0] } ]);
  });

  it('descendant numeric literal gets first element', function() {
    var results = jp.nodes(data, '$.store.book..0');
    assert.deepEqual(results, [ { path: [ '$', 'store', 'book', 0 ], value: data.store.book[0] } ]);
  });

  it('root element gets us original obj', function() {
    var results = jp.nodes(data, '$');
    assert.deepEqual(results, [ { path: ['$'], value: data } ]);
  });

  it('subscript double-quoted string', function() {
    var results = jp.nodes(data, '$["store"]');
    assert.deepEqual(results, [ { path: ['$', 'store'], value: data.store} ]);
  });

  it('subscript single-quoted string', function() {
    var results = jp.nodes(data, "$['store']");
    assert.deepEqual(results, [ { path: ['$', 'store'], value: data.store} ]);
  });

  it('leading member component', function() {
    var results = jp.nodes(data, "store");
    assert.deepEqual(results, [ { path: ['$', 'store'], value: data.store} ]);
  });

  it('union of three array slices', function() {
    var results = jp.query(data, "$.store.book[0:1,1:2,2:3]");
    assert.deepEqual(results, data.store.book.slice(0,3));
  });

  it('slice with step > 1', function() {
    var results = jp.query(data, "$.store.book[0:4:2]");
    assert.deepEqual(results, [ data.store.book[0], data.store.book[2]]);
  });

  it('union of subscript string literal keys', function() {
    var results = jp.nodes(data, "$.store['book','bicycle']");
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book'], value: data.store.book },
      { path: ['$', 'store', 'bicycle'], value: data.store.bicycle },
    ]);
  });

  it('union of subscript string literal three keys', function() {
    var results = jp.nodes(data, "$.store.book[0]['title','author','price']");
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', '0', 'title'], value: data.store.book[0].title },
      { path: ['$', 'store', 'book', '0', 'author'], value: data.store.book[0].author },
      { path: ['$', 'store', 'book', '0', 'price'], value: data.store.book[0].price }
    ]);
  });

  it('union of subscript integer three keys followed by member-child-identifier', function() {
    var results = jp.nodes(data, "$.store.book[1,2,3]['title']");
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', '1', 'title'], value: data.store.book[1].title },
      { path: ['$', 'store', 'book', '2', 'title'], value: data.store.book[2].title },
      { path: ['$', 'store', 'book', '3', 'title'], value: data.store.book[3].title }
    ]);
  });

  it('union of subscript integer three keys followed by union of subscript string literal three keys', function() {
    var results = jp.nodes(data, "$.store.book[0,1,2,3]['title','author','price']");
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', '0', 'title'], value: data.store.book[0].title },
      { path: ['$', 'store', 'book', '0', 'author'], value: data.store.book[0].author },
      { path: ['$', 'store', 'book', '0', 'price'], value: data.store.book[0].price },
      { path: ['$', 'store', 'book', '1', 'title'], value: data.store.book[1].title },
      { path: ['$', 'store', 'book', '1', 'author'], value: data.store.book[1].author },
      { path: ['$', 'store', 'book', '1', 'price'], value: data.store.book[1].price },
      { path: ['$', 'store', 'book', '2', 'title'], value: data.store.book[2].title },
      { path: ['$', 'store', 'book', '2', 'author'], value: data.store.book[2].author },
      { path: ['$', 'store', 'book', '2', 'price'], value: data.store.book[2].price },
      { path: ['$', 'store', 'book', '3', 'title'], value: data.store.book[3].title },
      { path: ['$', 'store', 'book', '3', 'author'], value: data.store.book[3].author },
      { path: ['$', 'store', 'book', '3', 'price'], value: data.store.book[3].price }
    ]);
  });

  it('union of subscript 4 array slices followed by union of subscript string literal three keys', function() {
    var results = jp.nodes(data, "$.store.book[0:1,1:2,2:3,3:4]['title','author','price']");
    assert.deepEqual(results, [
      { path: ['$', 'store', 'book', '0', 'title'], value: data.store.book[0].title },
      { path: ['$', 'store', 'book', '0', 'author'], value: data.store.book[0].author },
      { path: ['$', 'store', 'book', '0', 'price'], value: data.store.book[0].price },
      { path: ['$', 'store', 'book', '1', 'title'], value: data.store.book[1].title },
      { path: ['$', 'store', 'book', '1', 'author'], value: data.store.book[1].author },
      { path: ['$', 'store', 'book', '1', 'price'], value: data.store.book[1].price },
      { path: ['$', 'store', 'book', '2', 'title'], value: data.store.book[2].title },
      { path: ['$', 'store', 'book', '2', 'author'], value: data.store.book[2].author },
      { path: ['$', 'store', 'book', '2', 'price'], value: data.store.book[2].price },
      { path: ['$', 'store', 'book', '3', 'title'], value: data.store.book[3].title },
      { path: ['$', 'store', 'book', '3', 'author'], value: data.store.book[3].author },
      { path: ['$', 'store', 'book', '3', 'price'], value: data.store.book[3].price }
    ]);
  });


  it('nested parentheses eval', function() {
    var pathExpression = '$..book[?( @.price && (@.price + 20 || false) )]'
    var results = jp.query(data, pathExpression);
    assert.deepEqual(results, data.store.book);
  });

  it('array indexes from 0 to 100', function() {
    var data = [];
    for (var i = 0; i <= 100; ++i)
      data[i] = Math.random();

    for (var i = 0; i <= 100; ++i) {
      var results = jp.query(data, '$[' + i.toString() +  ']');
      assert.deepEqual(results, [data[i]]);
    }
  });

  it('descendant subscript numeric literal', function() {
    var data = [ 0, [ 1, 2, 3 ], [ 4, 5, 6 ] ];
    var results = jp.query(data, '$..[0]');
    assert.deepEqual(results, [ 0, 1, 4 ]);
  });

  it('descendant subscript numeric literal', function() {
    var data = [ 0, 1, [ 2, 3, 4 ], [ 5, 6, 7, [ 8, 9 , 10 ] ] ];
    var results = jp.query(data, '$..[0,1]');
    assert.deepEqual(results, [ 0, 1, 2, 3, 5, 6, 8, 9 ]);
  });

  it('throws for no input', function() {
    assert.throws(function() { jp.query() }, /needs to be an object/);
  });

  it('throws for bad input', function() {
    assert.throws(function() { jp.query("string", "string") }, /needs to be an object/);
  });

  it('throws for bad input', function() {
    assert.throws(function() { jp.query({}, null) }, /we need a path/);
  });

});

