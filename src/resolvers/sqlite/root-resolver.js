const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const noop = require('lodash/noop');
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
    const propColumnName = prop.getPropertyColumnName();
    return `${tableAlias}.${propColumnName}`;
  }).join(',')}
  `;
};

const useGroupBy = (schema, { groupBy = [] }) => {
  if (!groupBy.length) {
    return '';
  }
  return `GROUP BY ${groupBy
    .map((propName) => {
      const prop = schema.translateToProperty(propName);
      const tableAlias = prop.getPropertyTableAlias();
      const propColumnName = prop.getPropertyColumnName();
      return `${tableAlias}.${propColumnName}`;
    })
    .join(',')}`;
};

const useWhere = (schema, options) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const { where } = schemaDefinedOptions;
  // filter the object keys name only that have value inside the query options object.
  const useFilters = keys(where)
    .filter(filterName => !isNil(options[filterName]));
  return !useFilters.length
    ? ''
    : `WHERE ${useFilters
      .map(filterName => translateFilterProp(where[filterName], options[filterName], schema))
      .join(' AND ')}`;
};

// todo: use another schemas when filter refers to a nested schema.
const translateFilterProp = (condition, value, schema) => {
  debug.info(`Resolving '${condition}' with value: '${value}'`);
  // Resolves the operator from the condition. Generally it is at
  // the beginning of the condition string.
  const opr = Array.from(condition.match(/^\W+/)).shift();
  // Removes the operator from the condition string.
  const propName = condition.replace(/^\W+/, '');
  const prop = schema.translateToProperty(propName);
  const propColumnName = prop.getPropertyColumnName();
  const tableAlias = schema.getTableHash();
  return resolvePropWithOperator(`${tableAlias}.${propColumnName}`, opr, value);
};

// todo: resolve another types of operators.
const resolvePropWithOperator = (propName, operator, value) => {
  switch (operator) {
    case '=':
      return `${propName}=${value}`;
    case '%':
      return '';
    case '<>':
      return '';
    case '<':
      return '';
    case '>':
      return '';
    case '#':
      return '';
    case '|':
      return '';
    case '&':
      return '';
    default:
      return '';
  }
};

const resolveOptions = (schema, options) => {
  const { size, page } = options;
  const limit = useLimit(size);
  const offset = useOffset(size, page);
  const orderBy = useOrderBy(schema, options);
  const where = useWhere(schema, options);
  const groupBy = useGroupBy(schema, options);
  return `${where} ${groupBy} ${orderBy} ${limit} ${offset}`;
};

// const SQLiteGraphNodeOptionsResolver = null;

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
