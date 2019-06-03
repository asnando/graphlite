const isString = require('lodash/isString');
const _toString = require('lodash/toString');

const toString = value => (isString(value) ? value : _toString(value));

module.exports = toString;
