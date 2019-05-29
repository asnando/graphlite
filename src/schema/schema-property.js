const assign = require('lodash/assign');
const pickBy = require('lodash/pickBy');
const isNil = require('lodash/isNil');
const debug = require('../debug');
const constants = require('../constants');

const {
  GRAPHLITE_SUPPORTED_DATA_TYPES,
  GRAPHLITE_DEFAULT_DATA_TYPE,
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
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
}

module.exports = SchemaProperty;
