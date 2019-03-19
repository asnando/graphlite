module.exports = function jpretty(object, tabSize = 2) {
  return JSON.stringify(object, null, tabSize);
}