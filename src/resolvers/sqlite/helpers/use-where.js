const keys = require('lodash/keys');
const isNil = require('lodash/isNil');

const useWhere = (schema, queryOptions) => {
  const schemaFilters = schema.getFilterList();
  // Immediately return empty string if defined options of schema are not defined.
  if (!keys(schemaFilters).length) {
    return '';
  }
  const useFilters = keys(schemaFilters)
    .filter((filterName) => {
      if (/^static$/.test(filterName)) {
        return true;
      }
      const filterValue = queryOptions[filterName];
      if (!isNil(filterValue)) {
        return true;
      }
      return false;
    });
  // Immediatyle return empty string if no query options match with defined filters.
  if (!useFilters.length) {
    return '';
  }
  return `WHERE ${useFilters.map((filterName) => {
    const filter = schemaFilters[filterName];
    const filterValue = queryOptions[filterName];
    return filter.resolve(filterValue);
  }).join(' AND ')}`;
};

module.exports = useWhere;
