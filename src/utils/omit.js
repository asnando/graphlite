module.exports = function omit(object, ignores) {
  ignores.forEach(keyName => delete object[keyName]);
  return object;
}