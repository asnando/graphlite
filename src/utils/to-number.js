const isNumber = require('lodash/isNumber');
const _toNumber = require('lodash/toNumber');

const toNumber = value => (isNumber(value) ? value : _toNumber(value));

module.exports = toNumber;
