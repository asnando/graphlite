const _ = require('../../../utils');
const debug = require('../../../debugger');

// This resolver will add the json_group_array property into the query select area. The
// grouped ids can be used by the next nested nodes when its parent data is grouped.
module.exports = function graphNodeGroupIdsResolver(node, options, nextNodes, customResolver) {

  if (!node.parentAssociation || !node.haveGroupByOption()) return '';

  return _.toArray(node.parentAssociation)
  // In some cases the primary keys could be duplicated depending on the
  // association format. In that cases remove the duplication(s).
  .filter((association, index, self) => {
    return index === self.findIndex(b => (association.targetTable === b.targetTable) && (association.targetKey === b.targetKey));
  })
  .map(association => {
    return `, json_group_array(${association.targetTable}.${association.targetKey}) AS id_${association.targetKey}`;
  }).join(',').replace(/\,\,/g, ',').replace(/\,$/, '');
}