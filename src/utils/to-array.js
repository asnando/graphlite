const isArray = require('./is-array');

module.exports = function toArray(array) {
  return isArray(array) ? array : [array];
}