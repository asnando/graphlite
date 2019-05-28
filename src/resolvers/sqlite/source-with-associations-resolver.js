const debug = require('../../debug');
const resolveAssociation = require('./association-resolver');
const resolveSource = require('./source-resolver');

// todo: add description
const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node, resolveNextNodes) => {
  const args = [schema, options, node, resolveNextNodes];
  return node.isRoot() ? resolveSource(...args) : resolveAssociation(...args);
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
