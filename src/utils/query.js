module.exports = function queryFormat(query) {
  if (!process.env.WEBPACK_ENV) {
    const SQLFormatter = require('sql-formatter');
    return SQLFormatter.format(query);
  }
  return query;
}