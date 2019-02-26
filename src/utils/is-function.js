const type = require('./type');

module.exports = function isFunction(fn) {
  return type(fn) === 'function';
}