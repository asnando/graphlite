const sqlFormatter = require('sql-formatter');

const formatQuery = q => sqlFormatter.format(q);

module.exports = formatQuery;
