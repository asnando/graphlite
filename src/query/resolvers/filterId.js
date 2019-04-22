const _ = require('../../utils');
const debug = require('../../debugger');

// Render the part of the query where the ids of the root schema will be fetch.
module.exports = function graphRootNodeOptionsResolver(node, options, nextNodes, customResolver) {
  const nextNodeQuery     = nextNodes().replace(/json_object\(\)/g, '');
  const conditionClauses  = customResolver('options', options).replace(/json_object\(\)/g, '');
  const resolvedOptions   = node.getOptions(options, [ 'group', 'order', 'limit', 'offset' ]);
  if (node.parentAssociation) {
    return `${node.getJoin()} ${nextNodeQuery}`;
  } else {
    return `SELECT ${node.getDistinctPrimaryKey()} ${node.getSource()} ${nextNodeQuery} ${conditionClauses} ${resolvedOptions}`;
  }
}