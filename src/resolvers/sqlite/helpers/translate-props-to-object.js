const keys = require('lodash/keys');
const quote = require('../../../utils/quote');

// Returns the prop definition as pattern: 'propName', someTableRandomHash.propColumnName
const translatePropsToObject = (props, schemaHash) => keys(props).map((propName) => {
  const prop = props[propName];
  return quote(prop.getPropertyName())
    .concat(',')
    .concat(schemaHash)
    .concat('.')
    .concat(prop.getPropertyColumnName());
}).join(',');

module.exports = translatePropsToObject;
