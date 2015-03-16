/*
 * Copyright 2015 Netflix
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var KEYTYPES = {
  INDEXER: 'indexer',
  IDENTIFIER: 'identifier',
  INDEXER_STRING: 'indexer_string'
};

var operators = {
  "null": null,
  "undefined": undefined,
  "true": true,
  "false": false
};

var reservedKeywords = [
  "break","case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally",
  "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try",
  "typeof", "var", "void", "while", "with", "class", "const", "enum", "export", "extends", "import", "super"
];

var punctuators = ['.', '['];


/**
 * Does the array or string contain the element?
 * @param list
 * @param element
 * @returns {boolean}
 */
var contains = function (list, element) {
  return list.indexOf(element) !== -1;
};

/**
 * Remove single quotes or double quotes
 * @param str
 * @returns {*}
 */
var dequote = function (str) {
  if (str.charAt(0) == str.charAt(str.length -1) && contains(["'", '"'], str.charAt(0))) {
    str = str.substr(1, str.length - 2);
  }
  return str;
};

/**
 * Will that string be an integer once cast
 * @param str
 * @returns {boolean}
 */
var isIntegerString = function (str) {
  // works since NaN != NaN
  return +str === parseInt(str);
};

/**
 * Clean a key
 * @param {string} key
 * @param {string} keyType
 * @returns {string}
 */
var sanitizeKey = function (key, keyType) {
  switch (keyType) {
    case KEYTYPES.INDEXER:
      key = sanitizeIndexer(key);
      break;
    case KEYTYPES.INDEXER_STRING:
      key = sanitizeIndexerString(key);
      break;
    case KEYTYPES.IDENTIFIER:
    default:
      key = sanitizeIdentifier(key);
      break;
  }
  return key;
};

/**
 * Sanitize indexers
 * @param {string} indexer
 * @returns {*}
 */
var sanitizeIndexer = function (indexer) {
  if (operators.hasOwnProperty(indexer)) {
    return operators[indexer];
  } else if (isIntegerString(indexer)) {
    return +indexer;
  } else {
    if (contains(indexer, '[')) {
      throw Error("Found unexpected array in indexer.");
    }

    // a range has at least two dots
    if (!contains(indexer, '..') && !contains(indexer, ',')) {
      throw Error('Found unexpected identifier inside of indexer.');
    }

    // from here, we are dealing with ranges
    var ranges = indexer.split(',').map(function (str) {
      var from, to, dots, cleanStr;
      str = str.trim();
      cleanStr = dequote(str);

      if (cleanStr != str && isIntegerString(cleanStr)) {
        return cleanStr;
      } else if (isIntegerString(str)) {
        return +str;
      } else {
        var matches = str.match(/^([0-9]+(?:.[0-9])?)(.{2,3})([0-9]+(?:.[0-9])?)$/);
        if (matches) {
          if (
            (parseFloat(matches[1]) !== parseInt(matches[1])) ||
            (parseFloat(matches[3]) !== parseInt(matches[3]))) {
            throw Error("Found unexpected float in range.");
          }

          from = +matches[1];
          to = +matches[3];
          dots = matches[2];

          if (dots.length == 2) {
            return {from: from, to: to}
          } else {
            return {from: from, length: to-from}
          }
        } else {
          throw Error("Found unexpected non-integer in range.");
        }
      }
    });
    return ranges.length === 1 ? ranges[0] : ranges;
  }

};

/**
 * Sanitize indexer strings
 * @param {string} indexer
 * @returns {*}
 */
var sanitizeIndexerString = function (indexer) {
  var results = indexer.split(',').map(function (str) {
    str = str.trim();
    str = dequote(str);
    return str.replace('\\', '');
  });
  return results.length === 1 ? results[0] : results;
};

/**
 * Sanitize identifiers
 * @param {string} identifier
 * @returns {*}
 */
var sanitizeIdentifier = function (identifier) {
  if (!isNaN(+identifier)) {
    throw Error('Invalid identifier found.');
  }
  if (contains(reservedKeywords, identifier)) {
    throw Error("Keyword " + identifier + " is an invalid identifier.");
  }
  if (operators.hasOwnProperty(identifier)) {
    throw Error("Found unexpected " + operators[identifier] + ", expected identfier name.");
  }
  return identifier;
};

/**
 * Find the index of the next punctuator
 * @param {string} path
 * @param {number} fromIndex
 * @param {string} [punctuator]
 * @returns {*}
 */
var findNextPunctuator = function (path, fromIndex, punctuator) {
  var punctuatorsArr = !!punctuator ? [punctuator] : punctuators;

  var indexes = punctuatorsArr.map(function (character) {
    var index = path.indexOf(character, fromIndex);
    return index === -1 ? -1 : index + character.length - 1;
  }).filter(function (index) {
    return index > 0;
  });

  if (indexes.length === 1) {
    return indexes[0]
  } else if (indexes.length > 1) {
    return Math.min.apply(Math, indexes);
  }
  return path.length;
};

/**
 * Parse the path recursively
 * @param {string} path
 * @param {Array} [keys]
 * @param {number} [fromIndex]
 * @returns {Array}
 */
var parsePath = function (path, keys, fromIndex) {
  var startIndex, endIndex, key;
  var keyType = KEYTYPES.IDENTIFIER;

  if (keys == null) { keys = []; }
  if (fromIndex == null) { fromIndex = 0; }
  if (fromIndex >= path.length) { return keys; }

  var punctuator = path.charAt(fromIndex);
  var matchingPunctuator = '';

  if (!contains(punctuators, punctuator)) {
    // The first character should always be a legitimate punctuator
    // except if it is the beginning of the path
    if (fromIndex !== 0) {
      throw Error(path + ' is not a valid path');
    }
    punctuator = '';
  } else if (punctuator === '[') {
    matchingPunctuator = ']';
    keyType = KEYTYPES.INDEXER;

    ['"', "'"].some(function (quote) {
      if (path.charAt(fromIndex + 1) === quote) {
        matchingPunctuator = quote + matchingPunctuator;
        keyType = KEYTYPES.INDEXER_STRING;
      }
    });
  }

  startIndex = fromIndex + punctuator.length;
  endIndex = findNextPunctuator(path, startIndex, matchingPunctuator);

  key = sanitizeKey(path.substring(startIndex, endIndex), keyType);
  if (key !== false) { keys.push(key); }

  return parsePath(path, keys, endIndex + !!matchingPunctuator);
};


function parse(path){
  return parsePath(path);
}

module.exports = parse;
