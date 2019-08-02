const isString = require('lodash/isString');

const useGroupBy = (schema, { groupBy = [] }, queryOptions) => {
  // eslint-disable-next-line no-param-reassign
  groupBy = isString(groupBy) ? [groupBy] : groupBy;
  if (!groupBy.length) return '';
  return `GROUP BY ${groupBy
    .map((propName) => {
      const prop = schema.translateToProperty(propName);
      const tableAlias = prop.getPropertyTableAlias();
      const propColumnName = prop.getPropertyColumnName(queryOptions);
      return `${tableAlias}.${propColumnName}`;
    })
    .join(',')}`;
};

module.exports = useGroupBy;
