const _ = require('../utils');
const debug = require('../debugger');

module.exports = function graphRootNodeOptionsResolver(node, options, nextNodes, customResolver) {
  const nextNodeQuery = nextNodes().replace(/json_object\(\)/g, '');
  const conditionClauses = customResolver('options', options).replace(/json_object\(\)/g, '');
  const query = !!node.parentAssociation
    ? `${node.getJoin()} ${nextNodeQuery}`
    : `SELECT ${node.getDistinctPrimaryKey()} ${node.getSource()} ${nextNodeQuery} ${conditionClauses} ${node.getOptions(options, [ 'group', 'order', 'limit', 'offset' ])}`;
  return query;
}