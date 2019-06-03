const isBoolean = require('lodash/isBoolean');

const toBoolean = value => (isBoolean(value) ? value : !!value);

module.exports = toBoolean;
