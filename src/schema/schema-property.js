const assign = require('lodash/assign');
const pickBy = require('lodash/pickBy');
const isNil = require('lodash/isNil');
const debug = require('../debug');
const constants = require('../constants');

const {
  GRAPHLITE_SUPPORTED_DATA_TYPES,
  GRAPHLITE_DEFAULT_DATA_TYPE,
} = constants;

const graphliteSupportPropertyType = (type) => {
  return isNil(type) ? true : GRAPHLITE_SUPPORTED_DATA_TYPES.includes(type);
};

class SchemaProperty {
  constructor({
    schema,
    name,
    alias,
    parser,
    type,
  }) {
    assign(this, pickBy({
      schema,
      name,
      alias,
      parser,
    }));
    this.type = this._resolvePropertyType(type);
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

  getPropertyNameInTable() {
    return this.alias || this.name;
  }

  getPropertyName() {
    return this.name;
  }
}

module.exports = SchemaProperty;
