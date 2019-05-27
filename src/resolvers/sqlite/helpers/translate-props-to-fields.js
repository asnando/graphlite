const keys = require('lodash/keys');
const quote = require('../../../utils/quote');

// Returns the prop definition as pattern: 'propName', someTableRandomHash.propColumnName
const translatePropsToFields = (props, schemaHash) => keys(props).map((propName) => {
  const prop = props[propName];
  return schemaHash.concat('.').concat(prop.getPropertyColumnName());
}).join(',');

module.exports = translatePropsToFields;
