const pair = array => ((array.length % 2) ? array.concat('json_object') : array);

module.exports = pair;
