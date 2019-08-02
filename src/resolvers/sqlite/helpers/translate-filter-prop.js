const quote = require('../../../utils/quote');
const glob = require('../../../utils/glob');
const constants = require('../../../constants');
const schemaList = require('../../../jar/schema-list');

const {
  GRAPHLITE_STRING_DATA_TYPE,
} = constants;

// Resolve string (already quoted) within the '%' like operator.
const useLike = value => value.replace(/^'/, '\'%').replace(/'$/, '%\'');

const resolvePropWithOperator = (propName, propType, operator, value) => {
  if (propType === GRAPHLITE_STRING_DATA_TYPE) {
    // eslint-disable-next-line no-param-reassign
    value = quote(value);
  }
  switch (operator) {
    case '=':
      return `${propName}=${value}`;
    case '%':
      return `${propName} LIKE ${useLike(value)}`;
    case '<>':
      return `${propName}<>${value}`;
    case '<':
      return `${propName}<${value}`;
    case '>':
      return `${propName}>${value}`;
    case '#':
      return `${propName} GLOB ${glob(value)}`;
    case '|':
      return value.map(v => `${v}=${value}`).join(' OR ');
    case '&':
      return value.map(v => `${v}=${value}`).join(' AND ');
    default:
      return '';
  }
};

const translateFilterProp = (condition, value, schema, queryOptions) => {
  // Resolves the operator from the condition. Generally it is at
  // the beginning of the condition string.
  const opr = Array.from(condition.match(/^\W+/)).shift();
  // Removes the operator from the condition string.
  let propName = condition.replace(/^\W+/, '');
  let useSchema;
  let anotherSchema;
  // If property if prefixed with another schema name(eg: schema.propertyName) tries
  // to translate the property instance from the schema it refers to.
  if (/\w+\.\w+/.test(propName)) {
    const anotherSchemaName = propName.match(/(\w+)\.\w/)[1];
    propName = propName.replace(/\w+\.(\w+)/, '$1');
    anotherSchema = schemaList.getSchema(anotherSchemaName);
  }
  // Resolve which schema the prop refers to.
  // eslint-disable-next-line prefer-const
  useSchema = anotherSchema || schema;
  const prop = useSchema.translateToProperty(propName);
  const propType = prop.getPropertyType();
  const propColumnName = prop.getPropertyColumnName(queryOptions);
  const tableAlias = useSchema.getTableHash();
  return resolvePropWithOperator(`${tableAlias}.${propColumnName}`, propType, opr, value);
};

module.exports = translateFilterProp;
