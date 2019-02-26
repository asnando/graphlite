const type = require('./type');

module.exports = function isArray(array) {
  return type(array) === 'array';
}