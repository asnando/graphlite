const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const translateSchemaPropsLiterals = require('./translate-schema-props-literals');
const useWhere = require('./use-where');

const isQueryLike = str => !/^[\w\.]+$/.test(str);
const refersToSchemaProp = (schema, propName) => schema.hasProperty(propName);
const refersToNextNodeProp = propName => /\w+\.\w+/.test(propName);

const useOrderBy = (schema, { orderBy }, queryOptions) => {
  const resolvedOrderBy = isString(orderBy) ? [orderBy] : orderBy;

  // Return empty string if no order by condition.
  if (!isArray(resolvedOrderBy)) return '';

  // If no props to order by then return empty string.
  if (!resolvedOrderBy.length) {
    return '';
  }

  return `ORDER BY ${resolvedOrderBy.map((propName) => {
    const orderOperator = /^\W/.test(propName) ? /^\W/.match(propName) : null;
    // Remove asc/desc initial operator.
    const usePropName = propName.replace(/^\W/, '');
    let orderType = '';

    switch (orderOperator) {
      case '<':
        orderType = 'DESC';
        break;
      case '>':
      default:
        orderType = 'ASC';
        break;
    }

    // If prop name is like a query parse it as javascript literals resolving
    // the properties real names inside it.
    if (isQueryLike(usePropName)) {
      return translateSchemaPropsLiterals(usePropName, schema, queryOptions);
    }

    if (refersToSchemaProp(schema, usePropName)) {
      const prop = schema.translateToProperty(usePropName);
      const tableAlias = prop.getPropertyTableAlias();
      const propColumnName = prop.getPropertyColumnName(queryOptions);
      return `${tableAlias}.${propColumnName} ${orderType}`;
    }

    // todo: Add support to next node property order at this node.
    if (refersToNextNodeProp(usePropName)) {
      return null;
    }

    // Refers to a schema filter.
    let condition = useWhere(schema, queryOptions);
    if (condition) {
      // Remove the where clause from the condition.
      condition = condition.replace(/WHERE\s?/, '');
      return `CASE WHEN ${condition} THEN 0 ELSE 1 END`;
    }
    return null;
  }).filter(o => !!o).join(',')}
  `;
};

module.exports = useOrderBy;
