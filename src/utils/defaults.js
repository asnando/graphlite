const isDef = require('./is-def');

module.exports = function defaults(value, dflt, parser) {
  return isDef(value) && isDef(parser) ? parser(value) : isDef(value) ? value : dflt;
}