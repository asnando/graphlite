module.exports = function type(a) {
  return Object.prototype.toString.call(a).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
}