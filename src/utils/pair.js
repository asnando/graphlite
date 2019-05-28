const pair = (array, value = '') => ((array.length % 2) ? array.concat(value) : array);

module.exports = pair;
