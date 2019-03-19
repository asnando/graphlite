const type = require('./type');

module.exports = function isString(string) {
  return type(string) === 'string';
}