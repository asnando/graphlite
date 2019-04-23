module.exports = function get(object, path) {
  return path.split('.').reduce((obj, key) =>
    (obj && obj[key] !== 'undefined') ? obj[key] : undefined, object);
}