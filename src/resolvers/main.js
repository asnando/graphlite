const _ = require('../utils');
const debug = require('../debugger');
const SQLFormatter = require('sql-formatter');

module.exports = function graphNodeResolver(node, options = {}, nextNodes, customResolver) {

  const objectType = node.getObjectType();

  const struct = objectType === 'object'
    ? `select json_patch(json_object($fields_as_json), ($next_nodes)) $object_name from (select $raw_fields $source $options) $table_alias`
    : `(select json_object($node_name, (select json_group_array(json_patch(json_object($fields_as_json), ($next_nodes))) from (select $raw_fields $source $options) $table_alias)))`;

  let query = struct
      .replace(/\$table_alias/,     node.getTableAlias())
      .replace(/\$raw_fields/,      node.getRawFields())
      .replace(/\$source/,          node.getSource())
      .replace(/\$fields_as_json/,  node.getFieldsAsJson())
      .replace(/\$object_name/,     node.getResponseObjectName())
      .replace(/\$node_name/,       node.getAssociationName())
      .replace(/\$next_nodes/,      nextNodes(options))
      .replace(/\$options/,         node.getShowOptions(options))

  // Build the filter subquery in order to select the root schema
  // identifiers that will be returned by the select.
  if (!node.parentAssociation) {
    const filterQuery = customResolver('filterId', options);
    query += ` WHERE ${node.getTableAlias()}.${node.getPrimaryKey()} IN (${filterQuery})`;
  }

  query = SQLFormatter.format(query);

  if (!node.parentAssociation) {
    // debug.log(query);
    _.pbcopy(query);
  }

  return query;
}