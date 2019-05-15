const _ = require('../../../utils');
const debug = require('../../../debugger');

module.exports = function graphNodeResolver(node, options = {}, nextNodes, customResolver, parentNode) {

  const objectType = node.getObjectType();
  const hasParentAssociation = !!node.parentAssociation;

  let nodeOptions = node.getOptions(options, [
    // Disable order by inside the first node (as it will be already
    // ordered inside the where clause of the 'filterId' resolver result).
    hasParentAssociation ? 'order' : null,
    'group',
    'limit',
    'offset'
  ]);

  // Fix: Root schema can not have "limit" nor "offset" options (this options)
  // are filtered inside the specific where clauses condition outside this node.
  if (!hasParentAssociation) {
    nodeOptions = nodeOptions
      .replace(/LIMIT\s\d+/, '')
      .replace(/OFFSET\s\d+/, '');
  }

  const resolvedNextNodes = nextNodes(options);

  let struct;

  // Remove unecessary json patches. This approach is used when the next nodes
  // string contains an empty object string eg: 'json_object()'.
  if (/object/.test(objectType)) {
    if (hasParentAssociation && /^json_object\(\)$/.test(resolvedNextNodes)) {
      struct = `select json_object($fields_as_json) $object_name $grouped_ids $source $show_options $options`;
    } else if (!hasParentAssociation) {
      struct = `select /* begin json_patch #1 */ json_patch(json_object($fields_as_json), ($next_nodes)) /* end json_patch #1 */ $object_name from (select $table_alias.* from ($filter_id) as root left join $table_name as $table_alias on $table_alias.$primary_key=root.$primary_key) as $table_alias`;
    } else {
      struct = `select /* begin json_patch #1 */ json_patch(json_object($fields_as_json), ($next_nodes)) /* end json_patch #1 */ $object_name from (select $raw_fields $grouped_ids $source $show_options $options) $table_alias`;
    }
  } else {
    if (hasParentAssociation && /^json_object\(\)$/.test(resolvedNextNodes)) {
      struct = `(select json_object($node_name, (select json_group_array(json_object($fields_as_json)) from (select $raw_fields $grouped_ids $source $show_options $options) $table_alias)))`;
    } else {
      struct = `(select json_object($node_name, (select json_group_array(/* begin json_patch #2 */json_patch(json_object($fields_as_json), ($next_nodes))/* end json_patch #2 */) from (select $raw_fields $grouped_ids $source $show_options $options) $table_alias)))`;
    }
  }

  let query = struct
    .replace(/\$table_alias/g,     node.getTableAlias())
    .replace(/\$raw_fields/,      node.getRawFields())
    .replace(/\$grouped_ids/,     hasParentAssociation ? customResolver('groupId') : '')
    .replace(/\$source/,          node.getSource(parentNode && parentNode.haveGroupByOption()))
    .replace(/\$fields_as_json/,  node.getFieldsAsJson())
    .replace(/\$object_name/,     node.getResponseObjectName())
    .replace(/\$node_name/,       node.getAssociationName())
    .replace(/\$next_nodes/,      resolvedNextNodes)
    .replace(/\$show_options/,    node.getShowOptions(options))
    .replace(/\$options/,         nodeOptions)
    // Build the filter subquery in order to select the root schema
    // identifiers that will be returned by the select.
    .replace(/\$filter_id/,       customResolver('filterId', options))
    .replace(/\$table_name/,      node.getTableName())
    .replace(/\$primary_key/g,    node.getPrimaryKey())

  query = _.query(query);

  if (!hasParentAssociation) {
    _.pbcopy(query);
  }
  return query;
}