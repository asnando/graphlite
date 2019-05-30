const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const debug = require('../../../debug');

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

module.exports = useOrderBy;
