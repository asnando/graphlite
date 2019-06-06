const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const translateSchemaPropsLiterals = require('./translate-schema-props-literals');

const isQueryLike = str => !/^\w+$/.test(str);

const useOrderBy = (schema, { orderBy }) => {
  let resolvedOrderBy = isString(orderBy) ? [orderBy] : orderBy;
  // Return empty string if no order by condition.
  if (!isArray(resolvedOrderBy)) return '';
  // Filter which properties really belongs to the actual schema.
  resolvedOrderBy = resolvedOrderBy.filter((propName) => {
    const usePropName = propName.replace(/^\W/, '');
    // Check if schema really has the property.
    return isQueryLike(usePropName) || schema.hasProperty(usePropName);
  });
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
      return translateSchemaPropsLiterals(usePropName, schema);
    }

    const prop = schema.translateToProperty(usePropName);
    const tableAlias = prop.getPropertyTableAlias();
    const propColumnName = prop.getPropertyColumnName();
    return `${tableAlias}.${propColumnName} ${orderType}`;
  }).join(',')}
  `;
};

module.exports = useOrderBy;
