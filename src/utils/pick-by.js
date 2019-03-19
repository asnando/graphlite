const isDef = require('./is-def');

module.exports = function pickBy(object) {
  for (key in object) {
    if (!isDef(object[key]))
      delete object[key];
  }
  return object;
}