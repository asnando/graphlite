const assign = require('lodash/assign');
const pickBy = require('lodash/pickBy');
const isNil = require('lodash/isNil');
const isFunction = require('lodash/isFunction');
const isString = require('lodash/isString');
const debug = require('../debug');
const constants = require('../constants');
const toString = require('../utils/to-string');
const toNumber = require('../utils/to-number');
const toInt = require('../utils/to-int');
const toFloat = require('../utils/to-float');
const toBoolean = require('../utils/to-boolean');

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
    schemaName, tableAlias, name, alias, parser, type, defaultValue,
  }) {
    assign(this, pickBy({
      name,
      alias,
      schemaName,
      tableAlias,
      parser,
      defaultValue,
    }));
    const resolvedType = this._resolvePropertyType(type);
    // When property type matches "GRAPHLITE_PRIMARY_KEY_DATA_TYPE" it will
    // force change the property name to be "ID_PROPERTY_KEY_NAME" value.
    if (resolvedType === GRAPHLITE_PRIMARY_KEY_DATA_TYPE) {
      this.alias = alias || name;
      this.name = ID_PROPERTY_KEY_NAME;
    } else {
      this.alias = alias || name;
    }
    // Update property type.
    this.type = resolvedType;
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

  getPropertyType() {
    return this.type;
  }

  // After data fetch from database it must be parsed to the
  // real type and be parsed by the parser function(if defined).
  parseValue(...args) {
    let value = args[0];
    const { type, parser } = this;
    // If parser function is defined in the property inside schema definition
    // then will call it with the property value from database.
    if (parser && isFunction(parser)) {
      value = parser(value);
    }
    switch (type) {
      // string
      case GRAPHLITE_STRING_DATA_TYPE:
        value = toString(value);
        break;
      // bool
      case GRAPHLITE_BOOLEAN_DATA_TYPE:
        value = toBoolean(value);
        break;
      // number
      case GRAPHLITE_NUMBER_DATA_TYPE:
        value = toNumber(value);
        break;
      // integer
      case GRAPHLITE_INTEGER_DATA_TYPE:
        value = toInt(value);
        break;
      // float
      case GRAPHLITE_FLOAT_DATA_TYPE:
        value = toFloat(value);
        break;
      // default, pkey
      case GRAPHLITE_DEFAULT_DATA_TYPE:
      case GRAPHLITE_PRIMARY_KEY_DATA_TYPE:
      default:
        break;
    }
    // If "defaultValue" is defined, then use it if property value is empty.
    if (!isNil(this.defaultValue)) {
      if ((isString(value) && /^$/.test(value)) || !value) {
        value = this.defaultValue;
      }
    }
    return value;
  }
}

module.exports = SchemaProperty;
