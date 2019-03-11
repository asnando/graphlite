const _ = require('../utils');

module.exports = function graphNodeConditionResolver(node, options, nextNodes) {
  const query = !!node.parentAssociation ? node.parentAssociation.simpleJoin()
    : `SELECT DISTINCT ${node.tableName}.${node.resolvePrimaryKey()} ${node.resolveSource()} ${nextNodes()}`;
  return query;
}