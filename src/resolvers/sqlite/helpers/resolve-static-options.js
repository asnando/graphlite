const isArray = require('lodash/isArray');
const translateConditionProps = require('./translate-condition-props');

// Will resolve all conditions from array, translating all schema properties
// by its names.
const resolveStaticOptions = (schema, conditions = []) => {
  if (!isArray(conditions)) {
    throw new Error('Static options must be defined as array of strings.');
  }
  return conditions
    .map(condition => translateConditionProps(schema, condition)).join(' AND ');
};

module.exports = resolveStaticOptions;
