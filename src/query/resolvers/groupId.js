const _ = require('../../utils');
const debug = require('../../debugger');

// This resolver will add the json_group_array property into the query select area. The
// grouped ids can be used by the next nested nodes when its parent data is grouped.
module.exports = function graphNodeGroupIdsResolver(node, options, nextNodes, customResolver) {
  return (!node.parentAssociation || !node.haveGroupByOption())
    ? '' : _.toArray(node.parentAssociation).map(association => {
      return `, json_group_array(${association.targetTable}.${association.targetKey}) AS id_${association.targetKey}`;
    }).join(',').replace(/\,\,/g, ',').replace(/\,$/, '');
}