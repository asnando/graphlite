const debug = require('../../../debug');

// todo: resolve another types of operators.
const resolvePropWithOperator = (propName, operator, value) => {
  switch (operator) {
    case '=':
      return `${propName}=${value}`;
    case '%':
      return '';
    case '<>':
      return '';
    case '<':
      return '';
    case '>':
      return '';
    case '#':
      return '';
    case '|':
      return '';
    case '&':
      return '';
    default:
      return '';
  }
};

// todo: use another schemas when filter refers to a nested schema.
const translateFilterProp = (condition, value, schema) => {
  debug.info(`Resolving '${condition}' with value: '${value}'`);
  // Resolves the operator from the condition. Generally it is at
  // the beginning of the condition string.
  const opr = Array.from(condition.match(/^\W+/)).shift();
  // Removes the operator from the condition string.
  const propName = condition.replace(/^\W+/, '');
  const prop = schema.translateToProperty(propName);
  const propColumnName = prop.getPropertyColumnName();
  const tableAlias = schema.getTableHash();
  return resolvePropWithOperator(`${tableAlias}.${propColumnName}`, opr, value);
};

module.exports = translateFilterProp;
