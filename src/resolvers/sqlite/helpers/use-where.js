const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const translateFilterProp = require('./translate-filter-prop');

const useWhere = (schema, options) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const { where } = schemaDefinedOptions;
  // filter the object keys name only that have value inside the query options object.
  const useFilters = keys(where)
    .filter(filterName => !isNil(options[filterName]));
  return !useFilters.length
    ? ''
    : `WHERE ${useFilters
      .map(filterName => translateFilterProp(where[filterName], options[filterName], schema))
      .join(' AND ')}`;
};

module.exports = useWhere;
