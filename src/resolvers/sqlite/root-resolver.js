const debug = require('../../debug');

const SQLiteGraphNodeRootResolver = (node, options) => {
  const { schema } = node.getValue();
  const tableName = schema.getTableName();
  const tableHash = schema.getTableHash();
  const tableId = schema.getPrimaryKeyColumnName();
  const responseObjectName = 'response';
  const source = node.resolveNode(options, 'sourceWithAssociations');
  debug.log('resolved source with associations:', source);
  return `
  SELECT
    /* begin response object */
    json_patch(
      /* begin root json fields */
      json_object(),
      ($nextNodes)
      /* end root json fields */
    ) AS ${responseObjectName}
    /* end response object */
  FROM (
    SELECT
      /* begin root raw fields */
      *
      /* end root raw fields */
    FROM (
      SELECT
        /* begin root distinct id */
        DISTINCT ${tableId}
        /* end root distinct id */
      FROM
      /* begin root source */
      $source
      /* end root source */
      /* begin root associations */
      $associations
      /* end root associations */
      /* begin root options */
      $options
      /* end root options */
    ) AS root
    LEFT JOIN ${tableName} ON ${tableName}.${tableId}=root.${tableId}
  ) AS ${tableHash};
  `;
};

module.exports = SQLiteGraphNodeRootResolver;
