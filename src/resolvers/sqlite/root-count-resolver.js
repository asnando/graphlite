const {
  COUNT_RESPONSE_FIELD_NAME,
} = require('../../constants');
const resolveOptions = require('./helpers/resolve-options');

const SQLiteGraphNodeRootCountResolver = (
  schema,
  options,
  node,
  resolveNextNodes,
  resolveNode
) => {
  const countResponseFieldName = COUNT_RESPONSE_FIELD_NAME;
  const tableName = schema.getTableName();
  const tableHash = schema.getTableHash();
  const tableId = schema.getPrimaryKeyColumnName();
  const rootSourceWithAssociations = resolveNode('rootSourceWithAssociations');
  const resolvedOptions = resolveNode('rootOptions');
  const resolvedExtraOptions = resolveOptions(schema, options, node, ['groupBy']);
  // const nextNodes = resolveNode('node', { usePatch: true });

  return `
    SELECT
      count(${tableHash}.${tableId}) AS ${countResponseFieldName}
    FROM (
      SELECT
        /* begin root raw fields */
        ${tableHash}.*
        /* end root raw fields */
      FROM (
        SELECT
          /* begin root distinct id */
          DISTINCT ${tableHash}.${tableId}
          /* end root distinct id */
        /* begin root source with associations */
        ${rootSourceWithAssociations}
        /* end root source with associations */
        /* begin root options */
        ${resolvedOptions}
        ${resolvedExtraOptions}
        /* end root options */
      ) AS root
      LEFT JOIN ${tableName} AS ${tableHash} ON ${tableHash}.${tableId}=root.${tableId}
    ) AS ${tableHash};
  `;
};

module.exports = SQLiteGraphNodeRootCountResolver;
