const _ = require('../utils');
const debug = require('../debugger');

module.exports = function graphNodeConditionResolver(node, options, nextNodes) {
  // Fix: Temporally fix
  nextNodeQuery = nextNodes().replace(/json_object\(\)/g, '');
  const resolvedOptions = node.resolveOptions(options);
  return !!node.parentAssociation
    ? node.parentAssociation.resolveJoin()
    : `SELECT DISTINCT ${node.tableName}.${node.resolvePrimaryKey()} ${node.resolveSource()} ${nextNodeQuery} ${resolvedOptions}`;
}