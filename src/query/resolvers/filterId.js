const _ = require('../../utils');
const debug = require('../../debugger');

// Render the part of the query where the ids of the root schema will be fetch.
module.exports = function graphRootNodeOptionsResolver(node, options, nextNodes, customResolver) {
  const nextNodeQuery   = nextNodes().replace(/json_object\(\)/g, '');
  let conditionClauses  = customResolver('options', options).replace(/json_object\(\)/g, '');
  const resolvedOptions = node.getOptions(options, [ 'group', 'order', 'limit', 'offset' ]);
  const hasCondition = !!conditionClauses && !/^\s{0,}$/.test(conditionClauses);

  // Quick fix: Remove duplicated 'where' keyword(s).
  if (hasCondition && /WHERE/.test(conditionClauses) && (conditionClauses.match(/WHERE/g).length > 1)) {
    conditionClauses = conditionClauses.trim().replace(/(?!^)(WHERE)/g, ' AND ');
  }

  if (node.parentAssociation) {
    return `${node.getJoin(hasCondition)} ${nextNodeQuery}`;
  } else {
    return `SELECT ${node.getDistinctPrimaryKey()} ${node.getSource()} ${nextNodeQuery} ${conditionClauses} ${resolvedOptions}`;
  }
}