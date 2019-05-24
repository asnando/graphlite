const debug = require('../../debug');
const constants = require('../../constants');

const {
  RESPONSE_OBJECT_NAME,
} = constants;

const SQLiteGraphNodeRootResolver = (nodeValue, options, node, resolveNextNodes, resolveNode) => {
  // const { schema } = nodeValue;
  const schema = nodeValue;
  const tableName = schema.getTableName();
  const tableHash = schema.getTableHash();
  const tableId = schema.getPrimaryKeyColumnName();
  const responseObjectName = RESPONSE_OBJECT_NAME;
  // Starts a new resolver loop from the actual node. It will render the
  // "root source with associations" query piece.
  const rootSourceWithAssociations = resolveNode('sourceWithAssociations');
  return `
  SELECT
    /* begin response object */
    json_patch(
      /* begin root json fields */
      json_object(
        $rootObjectFields
      ),
      /* end root json fields */
      /* begin nested nodes */
      ($nestedNodes)
      /* end nested nodes */
    ) AS ${responseObjectName}
    /* end response object */
  FROM (
    SELECT
      /* begin root raw fields */
      ${tableHash}.*
      /* end root raw fields */
    FROM (
      SELECT
        /* begin root distinct id */
        DISTINCT ${tableId}
        /* end root distinct id */
      /* begin root source with associations */
      ${rootSourceWithAssociations}
      /* end root source with associations */
      /* begin root options */
      $options
      /* end root options */
    ) AS root
    LEFT JOIN ${tableName} AS ${tableHash} ON ${tableHash}.${tableId}=root.${tableId}
  ) AS ${tableHash};
  `;
};

module.exports = SQLiteGraphNodeRootResolver;
