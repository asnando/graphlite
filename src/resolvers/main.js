const _ = require('../utils');
const SQLFormatter = require('sql-formatter');

module.exports = function graphNodeResolver(node, options = {}, nextNodes, customResolver) {

  const objectType = !node.parentAssociation ? 'object' : node.parentAssociation.associationType;
  const nodeName = node.name;
  const nodeAlias = node.hash;

  const struct = objectType === 'object'
    ? `select json_patch(json_object(<:fields:>), (<:next_nodes:>)) from (select <:fields_without_hash:> <:source:>) <:node_alias:>`
    : `(select json_object(<:node_name:>, (select json_group_array(json_patch(json_object(<:fields:>), (<:next_nodes:>))) from (select <:fields_without_hash:> <:source:>) <:node_alias:>)))`;

  let query = struct
    .replace(/<:fields:>/, node.resolveFields())
    .replace(/<:fields_without_hash:>/, node.resolveFields(true, false))
    .replace(/<:next_nodes:>/, nextNodes())
    .replace(/<:source:>/, node.resolveSource())
    .replace(/<:node_name:>/, _.quote(nodeName))
    .replace(/<:node_alias:>/, nodeAlias);

  // Build the filter subquery in order to select the root schema
  // identifiers that will be returned by the select.
  if (!node.parentAssociation) {
    const primaryKey = node.resolvePrimaryKey();
    const filterQuery = customResolver('filterId', options);
    query += ` WHERE ${nodeAlias}.${primaryKey} IN (${filterQuery})`;
  }

  if (!node.parentAssociation) {
    query = SQLFormatter.format(query);
    // debug.warn(query);
    _.pbcopy(query);
  }

  return query;
}