const type = require('./type');

module.exports = function isNumber(number) {
  return type(number) === 'number';
}