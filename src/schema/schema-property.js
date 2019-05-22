const _ = require('lodash');
const debug = require('../debug');
const constants = require('../constants');

const {
  GRAPHLITE_SUPPORTED_DATA_TYPES,
  GRAPHLITE_DEFAULT_DATA_TYPE,
} = constants;

const graphliteSupportPropertyType = type => GRAPHLITE_SUPPORTED_DATA_TYPES.includes(type);

class SchemaProperty {
  constructor({
    schema,
    name,
    alias,
    parser,
    type,
  }) {
    _.assign(this, _.pickBy({
      schema,
      name,
      alias,
      parser,
    }));
    this.type = this._resolvePropertyType(type);
  }

  _resolvePropertyType(type) {
    if (!type) {
      debug.warn(`Undefined type on prop "${this.name}", using "${GRAPHLITE_DEFAULT_DATA_TYPE}".`);
      type = GRAPHLITE_DEFAULT_DATA_TYPE;
    } else if (!graphliteSupportPropertyType(type)) {
      throw new Error(`Unrecognized type "${type}" on prop "${this.name}"`);
    }
    return type;
  }
  
  getPropertyNameInTable() {
    return this.alias || this.name;
  }

  getPropertyName() {
    return this.name;
  }

  parsePropertyValue(value) {
    debug.log(this.type, this.parser);
  }
}

module.exports = SchemaProperty;
