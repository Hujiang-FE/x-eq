/*
 * x-eq
 * https://github.com/qiu8310/x-eq
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

require('./polyfill.js');

/**
 * 拆分 rule 的 selectorText
 *
 * @example
 *
 *  '.a .b, .a .c' => [['.a', '.b'], ['.a', '.c']]
 *
 * @param {String} selectorText
 * @returns {Array<Array<String>>}
 */
function splitSelectorText(selectorText) {
  var result = [],
      replacer = function replacer(w) {
    return '_'.repeat(w.length);
  },
      muteCommaSelectorText = selectorText.replace(/([\'\"]).*?\1/g, replacer) // 换掉所有引号中的内容
  .replace(/\[.*?\]|\(.*?\)/g, replacer); // 换掉所有括号和中括号中的内容

  var selectorParts = undefined,
      subSelectorParts = undefined,
      i = undefined,
      j = undefined,
      selector = undefined,
      start = 0,
      part = undefined;
  selectorParts = muteCommaSelectorText.split(',');
  for (i = 0; i < selectorParts.length; i++) {
    selector = [];
    subSelectorParts = selectorParts[i].split(' ');
    for (j = 0; j < subSelectorParts.length; j++) {
      part = selectorText.substr(start, subSelectorParts[j].length).trim();
      if (part) selector.push(part);
      start += subSelectorParts[j].length + 1;
    }
    result.push(selector);
  }

  return result;
}

var rAttrNoValue = /\[\s*([\w\-]+)\s*\]/g,
    rAttrQuoted = /\[\s*([\w\-]+)([\*\^\$\~]?=)([\'\"])(.*?)\3\s*\]/g,
    rAttrNoQuoted = /\[\s*([\w\-]+)([\*\^\$\~]?=)([^\]]*?)\s*\]/g;

/**
 *
 * @example
 *
 * @param {Array} splitSelector
 * @param {Array} attributeKeys
 * @returns {Array}
 * @private
 */
function _extractSelector(splitSelector, attributeKeys) {
  var selector = '',
      part = undefined,
      replaced = undefined,
      attributes = undefined,
      result = [],
      replacer = function replacer(raw, key, glue, quote, value) {
    if (attributeKeys.indexOf(key) < 0) return raw;

    if (typeof glue === 'number') {
      // no value
      glue = '';
      value = true;
    } else if (typeof value === 'number') {
      // no quote
      value = quote.trim();
    } else {
      value = value.trim();
    }

    replaced = true;
    attributes[key] = { glue: glue, value: value };

    return '';
  };

  for (var i = 0; i < splitSelector.length; i++) {
    attributes = {};
    replaced = false;

    part = splitSelector[i].replace(rAttrNoValue, replacer).replace(rAttrQuoted, replacer).replace(rAttrNoQuoted, replacer).trim();

    if (part) {
      selector += part;
      if (replaced) {
        result.push({ selector: selector, attributes: attributes });
      }
      selector += ' ';
    }
  }

  return result;
}

/**
 *
 *
 * @example
 * ('i[a=1][b=2] [c=3][d=4]', ['b', 'd'])
 * =>
 * [
 *    {selector: 'i[a=1]', attributes: {b: {glue: '=', value: '2'}}},
 *    {selector: 'i[a=1] [c=3]', attributes: {d: {glue: '=', value: '4'}}}
 * ]
 *
 * @param {String} selectorText
 * @param {Array} attributeKeys
 */
function extractAttributesFromSelectorText(selectorText, attributeKeys) {
  var splitResult = splitSelectorText(selectorText);
  var result = [];
  for (var i = 0; i < splitResult.length; i++) {
    result.push.apply(result, _toConsumableArray(_extractSelector(splitResult[i], attributeKeys)));
  }
  return result;
}

function getEmSize(element) {
  if (!element) element = document.documentElement;
  return parseFloat(getComputedStyle(element, 'fontSize')) || 16;
}

/**
 * @param {Node} element
 * @param {String|Number} value
 * @returns {Number}
 */
function convertToPx(element, value) {
  var units = value.replace(/[0-9]*/, '');
  value = parseFloat(value) || 0;
  switch (units) {
    case 'px':
      return value;
    case 'em':
      return value * getEmSize(element);
    case 'rem':
      return value * getEmSize();
    // Viewport units!
    // According to http://quirksmode.org/mobile/tableViewport.html
    // documentElement.clientWidth/Height gets us the most reliable info
    case 'vw':
      return value * document.documentElement.clientWidth / 100;
    case 'vh':
      return value * document.documentElement.clientHeight / 100;
    case 'vmin':
    case 'vmax':
      var vw = document.documentElement.clientWidth / 100;
      var vh = document.documentElement.clientHeight / 100;
      var chooser = Math[units === 'vmin' ? 'min' : 'max'];
      return value * chooser(vw, vh);
    default:
      return value;
    // for now, not supporting physical units (since they are just a set number of px)
    // or ex/ch (getting accurate measurements is hard)
  }
}

function _clean(element, key) {
  var val = element.getAttribute(key);
  return val ? (' ' + val + ' ').replace(/[\t\r\n]/g, ' ') : ' ';
}
function addAttribute(element, key, value) {
  if (!value || element.nodeType !== 1) return false;
  if (value === true) return element.setAttribute(key, '');

  var current = _clean(element, key);
  if (current.indexOf(' ' + value + ' ') < 0) {
    element.setAttribute(key, (current + value).trim());
  }
}
function removeAttribute(element, key, value) {
  if (!value || element.nodeType !== 1) return false;
  if (value === true) return element.removeAttribute(key);

  var current = _clean(element, key),
      tmp = ' ' + value + ' ',
      updated = false;
  while (current.indexOf(tmp) >= 0) {
    current = current.replace(tmp, ' ');
    updated = true;
  }
  if (updated) {
    current = current.trim();
    if (!current) element.removeAttribute(key);else element.setAttribute(key, current);
  }
}

exports['default'] = { splitSelectorText: splitSelectorText, extractAttributesFromSelectorText: extractAttributesFromSelectorText,
  convertToPx: convertToPx, removeAttribute: removeAttribute, addAttribute: addAttribute };
module.exports = exports['default'];