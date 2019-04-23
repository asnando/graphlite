const _ = require('../../utils');
const debug = require('../../debugger');

module.exports = function graphCountResolver(node, options, nextNodes, customResolver) {
  let query = ``;
  
  const nextNodeQuery   = nextNodes().replace(/json_object\(\)/g, '');
  const resolvedOptions = node.getOptions(options, [ 'group', 'order', 'limit', 'offset' ]);
  let conditionClauses  = customResolver('options', options).replace(/json_object\(\)/g, '');

  if (node.parentAssociation) {
    query = `${node.getJoin()} ${nextNodeQuery}`;
  } else {
    query = `SELECT COUNT(${node.getDistinctPrimaryKey()}) AS count ${node.getSource()} ${nextNodeQuery} ${conditionClauses} ${resolvedOptions}`;
  }

  if (!node.parentAssociation) {
    query =  _.query(query);
  }

  return query;
}