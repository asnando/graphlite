const quote = require('../../../utils/quote');
const glob = require('../../../utils/glob');
const constants = require('../../../constants');
const debug = require('../../../debug');

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

// todo: use another schemas when filter refers to a nested schema.
const translateFilterProp = (condition, value, schema) => {
  // Resolves the operator from the condition. Generally it is at
  // the beginning of the condition string.
  const opr = Array.from(condition.match(/^\W+/)).shift();
  // Removes the operator from the condition string.
  const propName = condition.replace(/^\W+/, '');
  const prop = schema.translateToProperty(propName);
  const propType = prop.getPropertyType();
  const propColumnName = prop.getPropertyColumnName();
  const tableAlias = schema.getTableHash();
  return resolvePropWithOperator(`${tableAlias}.${propColumnName}`, propType, opr, value);
};

module.exports = translateFilterProp;