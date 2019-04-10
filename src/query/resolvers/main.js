const _ = require('../../utils');
const debug = require('../../debugger');

module.exports = function graphNodeResolver(node, options = {}, nextNodes, customResolver, parentNode) {

  const objectType = node.getObjectType();

  const struct = objectType === 'object'
    ? `select json_patch(json_object($fields_as_json), ($next_nodes)) $object_name from (select $raw_fields $grouped_ids $source $show_options $options) $table_alias`
    : `(select json_object($node_name, (select json_group_array(json_patch(json_object($fields_as_json), ($next_nodes))) from (select $raw_fields $grouped_ids $source $show_options $options) $table_alias)))`;

  let nodeOptions = node.getOptions(options, ['group', 'order', 'limit', 'offset']);
  
  if (!node.parentAssociation) {
    nodeOptions = nodeOptions.replace(/LIMIT\s\d+/, '').replace(/OFFSET\s\d+/, '');
  }

  let query = struct
      .replace(/\$table_alias/,     node.getTableAlias())
      .replace(/\$raw_fields/,      node.getRawFields())
      .replace(/\$grouped_ids/,     node.parentAssociation ? customResolver('groupId') : '')
      .replace(/\$source/,          node.getSource(parentNode && parentNode.haveGroupByOption()))
      .replace(/\$fields_as_json/,  node.getFieldsAsJson())
      .replace(/\$object_name/,     node.getResponseObjectName())
      .replace(/\$node_name/,       node.getAssociationName())
      .replace(/\$next_nodes/,      nextNodes(options))
      .replace(/\$show_options/,    node.getShowOptions(options))
      .replace(/\$options/,         nodeOptions)

  // Build the filter subquery in order to select the root schema
  // identifiers that will be returned by the select.
  if (!node.parentAssociation) {
    const filterQuery = customResolver('filterId', options);
    query += ` WHERE ${node.getTableAlias()}.${node.getPrimaryKey()} IN (${filterQuery})`;
    query += ` AND ${node.getResponseObjectName()} IS NOT NULL;`;
  }

  query = _.query(query);

  if (!node.parentAssociation) {
    _.pbcopy(query);
  }

  return query;
}