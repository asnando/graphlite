const assign = require('lodash/assign');
const pickBy = require('lodash/pickBy');
const isNil = require('lodash/isNil');
const isFunction = require('lodash/isFunction');
const debug = require('../debug');
const constants = require('../constants');

const isString = require('lodash/isString');
const isInteger = require('lodash/isInteger');
const isBoolean = require('lodash/isBoolean');
const isNumber = require('lodash/isNumber');
const toString = require('lodash/toString');
const toNumber = require('lodash/toNumber');

const isFloat = value => !(value % 1);

const parseToString = value => (isString(value) ? value : toString(value));
const parseToNumber = value => (isNumber(value) ? value : toNumber(value));
const parseToInt = value => (isInteger(value) ? value : parseInt(value, 1));
const parseToFloat = value => (isFloat(value) ? value : parseFloat(value));
const parseToBoolean = value => (isBoolean(value) ? value : !!value);

const {
  GRAPHLITE_SUPPORTED_DATA_TYPES,
  GRAPHLITE_DEFAULT_DATA_TYPE,
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
  GRAPHLITE_STRING_DATA_TYPE,
  GRAPHLITE_BOOLEAN_DATA_TYPE,
  GRAPHLITE_NUMBER_DATA_TYPE,
  GRAPHLITE_INTEGER_DATA_TYPE,
  GRAPHLITE_FLOAT_DATA_TYPE,
  ID_PROPERTY_KEY_NAME,
} = constants;

const graphliteSupportPropertyType = type => (
  isNil(type) ? true : GRAPHLITE_SUPPORTED_DATA_TYPES.includes(type)
);

class SchemaProperty {
  constructor({
    schemaName, tableAlias, name, alias, parser, type,
  }) {
    const resolvedType = this._resolvePropertyType(type);
    if (resolvedType === GRAPHLITE_PRIMARY_KEY_DATA_TYPE) {
      // save alias before it change to id
      alias = alias || name;
      name = ID_PROPERTY_KEY_NAME;
    } else {
      alias = alias || name;
    }
    assign(this, pickBy({
      name,
      alias,
      type: resolvedType,
      schemaName,
      tableAlias,
      parser,
    }));
  }

  _resolvePropertyType(type) {
    if (!graphliteSupportPropertyType(type)) {
      throw new Error(`Unrecognized type "${type}" on prop "${this.name}"`);
    }
    if (!type) {
      debug.warn(`Undefined type on prop "${this.name}", using "${GRAPHLITE_DEFAULT_DATA_TYPE}".`);
      return GRAPHLITE_DEFAULT_DATA_TYPE;
    }
    return type;
  }

  getPropertyName() {
    return this.name;
  }

  getPropertyAlias() {
    return this.alias;
  }

  getPropertyColumnName() {
    return this.alias || this.name;
  }

  getPropertySchemaName() {
    return this.schemaName;
  }

  getPropertyTableAlias() {
    return this.tableAlias;
  }

  // After data fetch from database it must be parsed to the
  // real type and be parsed by the parser function(if defined).
  parseValue(...args) {
    let value = args[0];
    const { type, parser } = this;
    switch (type) {
      // string
      case GRAPHLITE_STRING_DATA_TYPE:
        value = parseToString(value);
        break;
      // bool
      case GRAPHLITE_BOOLEAN_DATA_TYPE:
        value = parseToBoolean(value);
        break;
      // number
      case GRAPHLITE_NUMBER_DATA_TYPE:
        value = parseToNumber(value);
        break;
      // integer
      case GRAPHLITE_INTEGER_DATA_TYPE:
        value = parseToInt(value);
        break;
      // float
      case GRAPHLITE_FLOAT_DATA_TYPE:
        value = parseToFloat(value);
        break;
      // default, pkey
      case GRAPHLITE_DEFAULT_DATA_TYPE:
      case GRAPHLITE_PRIMARY_KEY_DATA_TYPE:
      default:
        break;
    }
    if (parser && isFunction(parser)) {
      value = parser(value);
    }
    return value;
  }
}

module.exports = SchemaProperty;
