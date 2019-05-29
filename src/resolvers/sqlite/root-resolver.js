const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const constants = require('../../constants');
const translatePropsToObject = require('./helpers/translate-props-to-object');
const debug = require('../../debug');

const {
  RESPONSE_OBJECT_NAME,
} = constants;

const useLimit = (size) => {
  return size ? `LIMIT ${size}` : '';
};

const useOffset = (size, page) => {
  return (size && page) ? `OFFSET ${(page - 1) * size}` : '';
};

const useOrderBy = (schema, { orderBy }) => {
  // eslint-disable-next-line no-param-reassign
  orderBy = isString(orderBy) ? [orderBy] : orderBy;
  // Return empty string if no order by condition.
  if (!isArray(orderBy)) return '';
  // Resolve order by.
  return `
  ORDER BY
  ${orderBy.map((propName) => {
    // todo: support asc/desc operator
    if (/^\W/.test(propName)) {
      debug.info(propName);
    }
    // todo: check if property description have schema table name before the property name.
    const prop = schema.translateToProperty(propName);
    const tableAlias = prop.getPropertyTableAlias();
    const columnName = prop.getPropertyColumnName();
    return `${tableAlias}.${columnName}`;
  }).join(',')}
  `;
};

const useGroupBy = (schema, groupBy) => {

};

const useWhere = (schema, options) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const { where } = schemaDefinedOptions;
  return `WHERE ${keys(where)
    // remove where conditions with no value.
    .filter(filterName => !isNil(where[filterName]))
    .map(filterName => aaa(where[filterName], options[filterName]))
    .join(' AND ')}`;
};

// todo: translate property name
// todo: add table hash before property column name
const aaa = (condition, value) => {
  const opr = Array.from(condition.match(/^\W+/)).shift();
  const propName = condition.replace(/^\W+/, '');
  debug.warn(opr, propName, value);
  return `${propName}${opr}${value}`;
};

// resolve: where, orderBy, groupBy, limit, offset
const resolveOptions = (schema, options, node) => {
  const { size, page } = options;
  // const parentSchema = node.parent ? node.parent.getValue() : null;
  const limit = useLimit(size);
  const offset = useOffset(size, page);
  const resolvedOrderBy = useOrderBy(schema, options);
  // useGroupBy(schema, options);
  const where = useWhere(schema, options);
  return `${where} ${resolvedOrderBy} ${limit} ${offset}`;
};

const SQLiteGraphNodeRootResolver = (schema, options, node, resolveNextNodes, resolveNode) => {
  const tableName = schema.getTableName();
  const tableHash = schema.getTableHash();
  const tableId = schema.getPrimaryKeyColumnName();
  const responseObjectName = RESPONSE_OBJECT_NAME;
  // Starts a new resolver loop from the actual node. It will render the
  // "root source with associations" query piece.
  const rootSourceWithAssociations = resolveNode('rootSourceWithAssociations');
  const rootObjectFields = translatePropsToObject(schema.getDefinedProperties(), tableHash);
  // Resolve next nodes query patching with json_patch() function.
  const nextNodes = resolveNode('node', { usePatch: true });
  // Resolve root node options.
  const resolvedOptions = resolveOptions(schema, options, node);
  return `
  SELECT
    /* begin response object */
    json_patch(
      /* begin root json fields */
      json_object(
        ${rootObjectFields}
      ),
      /* end root json fields */
      /* begin nested nodes */
      (${nextNodes})
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
        DISTINCT ${tableHash}.${tableId}
        /* end root distinct id */
      /* begin root source with associations */
      ${rootSourceWithAssociations}
      /* end root source with associations */
      /* begin root options */
      ${resolvedOptions}
      /* end root options */
    ) AS root
    LEFT JOIN ${tableName} AS ${tableHash} ON ${tableHash}.${tableId}=root.${tableId}
  ) AS ${tableHash};
  `;
};

module.exports = SQLiteGraphNodeRootResolver;
