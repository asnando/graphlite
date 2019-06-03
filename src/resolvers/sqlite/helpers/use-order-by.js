const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const translateSchemaPropsLiterals = require('./translate-schema-props-literals');
const debug = require('../../../debug');

const isQueryLike = str => !/^\w+$/.test(str);

const useOrderBy = (schema, { orderBy }) => {
  // eslint-disable-next-line no-param-reassign
  orderBy = isString(orderBy) ? [orderBy] : orderBy;
  // Return empty string if no order by condition.
  if (!isArray(orderBy)) return '';
  // Resolve order by.
  return `
  ORDER BY
  ${orderBy.map((propName) => {
    const orderOperator = /^\W/.test(propName) ? /^\W/.match(propName) : null;
    // Remove asc/desc initial operator.
    // eslint-disable-next-line no-param-reassign
    propName = propName.replace(/^\W/, '');

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
    if (isQueryLike(propName)) {
      return translateSchemaPropsLiterals(propName, schema);
    }

    const prop = schema.translateToProperty(propName);
    const tableAlias = prop.getPropertyTableAlias();
    const propColumnName = prop.getPropertyColumnName();
    return `${tableAlias}.${propColumnName} ${orderType}`;
  }).join(',')}
  `;
};

module.exports = useOrderBy;
