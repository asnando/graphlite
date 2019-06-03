const isInteger = require('lodash/isInteger');

const toInt = value => (isInteger(value) ? value : parseInt(value, 1));

module.exports = toInt;
