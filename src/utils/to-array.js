const isArray = require('./is-array');

module.exports = function toArray(array) {
  return typeof array === 'undefined' ? [] : isArray(array) ? array : [array];
}