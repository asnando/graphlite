const resolveOptions = require('./helpers/resolve-options');
const debug = require('../../debug');

const SQLiteGraphNodeRootOptionsResolver = (schema, options, node, resolveNextNodes) => {
  const optionsType = ['where'];
  return [
    resolveOptions(schema, options, node, optionsType),
    resolveNextNodes(),
  ]
    // Remove empty conditions.
    .filter(sql => sql && !/^\s{0,}$/.test(sql))
    // Resolve the begin of strings that is not the first from array replacing the 'where'
    // clause with 'AND'. This resolves the redudants WHERE which may cause the query to crash.
    .map((sql, index) => (!index ? sql : sql.replace(/^where/i, ' AND')))
    .join('');
};

module.exports = SQLiteGraphNodeRootOptionsResolver;
