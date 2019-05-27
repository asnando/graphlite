const assign = require('lodash/assign');
const pickBy = require('lodash/pickBy');
const isNil = require('lodash/isNil');
const debug = require('../debug');
const constants = require('../constants');

const {
  GRAPHLITE_SUPPORTED_DATA_TYPES,
  GRAPHLITE_DEFAULT_DATA_TYPE,
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
} = constants;

const graphliteSupportPropertyType = type => (
  isNil(type) ? true : GRAPHLITE_SUPPORTED_DATA_TYPES.includes(type)
);

class SchemaProperty {
  constructor({
    schema,
    schemaHash,
    name,
    alias,
    parser,
    type,
  }) {
    const resolvedType = this._resolvePropertyType(type);
    assign(this, pickBy({
      name: resolvedType === GRAPHLITE_PRIMARY_KEY_DATA_TYPE ? 'id' : name,
      alias: resolvedType === GRAPHLITE_PRIMARY_KEY_DATA_TYPE ? name : alias || name,
      type: resolvedType,
      schema,
      schemaHash,
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

  getPropertyColumnName() {
    return this.alias || this.name;
  }
}

module.exports = SchemaProperty;
