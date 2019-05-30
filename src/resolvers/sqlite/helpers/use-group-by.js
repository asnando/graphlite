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

module.exports = useGroupBy;
