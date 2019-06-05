const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const translateFilterProp = require('./translate-filter-prop');
const resolveStaticOptions = require('./resolve-static-options');

const useWhere = (schema, queryOptions) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const schemaOptions = schemaDefinedOptions.where;
  // Immediately return empty string if defined options of schema are not defined.
  if (!keys(schemaOptions).length) return '';
  // filter the object keys name only that have value inside the query options object.
  const useFilters = keys(schemaOptions)
    .filter(filterName => /^static$/.test(filterName) || !isNil(queryOptions[filterName]));
  // if no filter found, return empty string.
  if (!useFilters.length) return '';
  // return resolved where
  return `WHERE ${useFilters.map((filterName) => {
    const condition = schemaOptions[filterName];
    const optionValue = queryOptions[filterName];
    if (/^static$/.test(filterName)) {
      return resolveStaticOptions(schema, condition);
    }
    return translateFilterProp(condition, optionValue, schema);
  }).join(' AND ')}`;
};

module.exports = useWhere;
