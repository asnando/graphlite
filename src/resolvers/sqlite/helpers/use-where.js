const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const translateFilterProp = require('./translate-filter-prop');
const resolveStaticOptions = require('./resolve-static-options');

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
  const conditions = useFilters.map((filterName) => {
    const filter = schemaFilters[filterName];
    const filterValue = queryOptions[filterName];
    return filter.resolve(filterValue);
  });
  console.log('Resolved conditions:', conditions);
  return '';
  // ####
  // const schemaDefinedOptions = schema.getDefinedOptions();
  // const schemaOptions = schemaDefinedOptions.where;
  // // Immediately return empty string if defined options of schema are not defined.
  // if (!keys(schemaOptions).length) return '';
  // // filter the object keys name only that have value inside the query options object.
  // const useFilters = keys(schemaOptions)
  //   .filter(filterName => /^static$/.test(filterName) || !isNil(queryOptions[filterName]));
  // // if no filter found, return empty string.
  // if (!useFilters.length) return '';
  // // return resolved where
  // return `WHERE ${useFilters.map((filterName) => {
  //   const condition = schemaOptions[filterName];
  //   const optionValue = queryOptions[filterName];
  //   if (/^static$/.test(filterName)) {
  //     return resolveStaticOptions(schema, condition, queryOptions);
  //   }
  //   if (Array.isArray(condition)) {
  //     // When condition is defined as array, iterate over the array translating
  //     // the filter conditions to valid filter query string.
  //     return condition
  //       .map(c => translateFilterProp(c, optionValue, schema, queryOptions))
  //       .join(' AND ');
  //   }
  //   return translateFilterProp(condition, optionValue, schema, queryOptions);
  // }).join(' AND ')}`;
};

module.exports = useWhere;
