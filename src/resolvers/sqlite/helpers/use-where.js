const keys = require('lodash/keys');
const isNil = require('lodash/isNil');

const useWhere = (schema, queryOptions, { usePreservation = false } = {}) => {
  const schemaFilters = schema.getFilterList();

  // Immediately return empty string if defined options of schema are not defined.
  if (!keys(schemaFilters).length) {
    return '';
  }

  let useFilters = keys(schemaFilters)
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

  useFilters = useFilters.map(filterName => schemaFilters[filterName]);

  const resolvedFiltersWithValues = useFilters.filter(filter => (
    !filter.shouldPreserve(usePreservation)
  )).map((filter) => {
    const filterName = filter.getFilterName();
    const filterValue = queryOptions[filterName];
    return filter.resolve(filterValue);
  }).join(' AND ');

  return resolvedFiltersWithValues ? `WHERE ${resolvedFiltersWithValues}` : '';
};

module.exports = useWhere;
