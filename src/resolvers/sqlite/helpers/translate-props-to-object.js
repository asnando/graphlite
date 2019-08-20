const keys = require('lodash/keys');
const quote = require('../../../utils/quote');

// Returns the prop definition as pattern: 'propName', someTableRandomHash.propColumnName
const translatePropsToObject = (props, schemaHash, queryOptions = {}) => keys(props).map((propName) => {
  const prop = props[propName];
  return quote(`${schemaHash}.${prop.getPropertyName()}`)
    .concat(',')
    .concat(schemaHash)
    .concat('.')
    .concat(prop.getPropertyColumnName(queryOptions, /* useRaw */ true /* useRaw */));
}).join(',');

module.exports = translatePropsToObject;
