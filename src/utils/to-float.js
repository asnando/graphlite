const isFloat = require('./is-float');

const toFloat = value => (isFloat(value) ? value : parseFloat(value));

module.exports = toFloat;
