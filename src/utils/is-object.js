const type = require('./type');

module.exports = function isObject(object) {
  return type(object) === 'object';
}