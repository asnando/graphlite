const _ = require('../utils');
const debug = require('../debugger');
const SQLFormatter = require('sql-formatter');

const DEFAULT_OBJECT_TYPE = 'object';

module.exports = function graphNodeResolver(node, options = {}, nextNodes, customResolver) {

  const objectType = (!!node.parentAssociation && !!node.parentAssociation.objectType)
    ? node.parentAssociation.objectType : DEFAULT_OBJECT_TYPE;

  const nodeName = node.alias || node.name;
  const nodeAlias = node.hash;

  const struct = objectType === 'object'
    ? `select json_patch(json_object(<:fields:>), (<:next_nodes:>)) from (select <:fields_without_hash:> <:source:> <:options:>) <:node_alias:>`
    : `(select json_object(<:node_name:>, (select json_group_array(json_patch(json_object(<:fields:>), (<:next_nodes:>))) from (select <:fields_without_hash:> <:source:> <:options:>) <:node_alias:>)))`;

  let query = struct
    .replace(/<:fields:>/, node.resolveFields())
    .replace(/<:fields_without_hash:>/, node.resolveFields({
      raw: true,
      useHash: false,
      groupedIds: !!node.parentAssociation
    }, node.parentAssociation))
    .replace(/<:next_nodes:>/, nextNodes())
    .replace(/<:source:>/, node.resolveSource())
    .replace(/<:node_name:>/, _.quote(nodeName))
    .replace(/<:node_alias:>/, nodeAlias)
    .replace(/<:options:>/, node.resolveOptions(options));

  // Build the filter subquery in order to select the root schema
  // identifiers that will be returned by the select.
  // if (!node.parentAssociation) {
  //   const primaryKey = node.resolvePrimaryKey();
  //   const filterQuery = customResolver('filterId', options);
  //   query += ` WHERE ${nodeAlias}.${primaryKey} IN (${filterQuery})`;
  // }

  query = SQLFormatter.format(query);

  if (!node.parentAssociation) {
    // debug.warn(query);
    _.pbcopy(query);
  }

  return query;
}