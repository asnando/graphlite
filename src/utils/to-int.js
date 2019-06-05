const isInteger = require('lodash/isInteger');
const parseInt = require('lodash/parseInt');

const toInt = value => (isInteger(value) ? value : parseInt(value));

module.exports = toInt;
