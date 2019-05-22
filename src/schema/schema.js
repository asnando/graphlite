const assign = require('lodash/assign');
const isString = require('lodash/isString');
const jset = require('lodash/set');
const keys = require('lodash/keys');
const hashCode = require('../utils/hash-code');
const Association = require('./association');
const SchemaProperty = require('./schema-property');
const constants = require('../constants');
// const debug = require('../debug');

const {
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
} = constants;

const isPrimaryKeyDefined = props => !!keys(props).find((propName) => {
  const prop = props[propName];
  return GRAPHLITE_PRIMARY_KEY_DATA_TYPE === (isString(prop) ? prop : prop.type);
});

class Schema {
  constructor({
    name,
    tableName,
    properties,
  }) {
    if (!isString(name)) {
      throw new Error('Schema must have a unique name. The name is missing or is not a string.');
    }

    assign(this, {
      name,
      tableName,
      tableHash: hashCode(),
      properties: {},
      has: {},
      belongs: {},
    });

    if (!isPrimaryKeyDefined(properties)) {
      throw new Error(`Missing primary key on "${name}" schema.`);
    }

    this._definePropertiesFromList(properties);
  }

  _definePropertiesFromList(props = {}) {
    keys(props).forEach((propName) => {
      const prop = props[propName];
      jset(this.properties, propName, new SchemaProperty({
        name: propName,
        type: isString(prop) ? prop : prop.type,
        alias: prop.alias,
        parser: prop.parser,
        useLocale: prop.useLocale,
        schema: this.name,
      }));
    });
  }

  _getPrimaryKey() {
    const props = this.properties;
    return keys(props).find(propName => props[propName].type === GRAPHLITE_PRIMARY_KEY_DATA_TYPE);
  }

  _getPrimaryKeyName() {
    return this._getPrimaryKey();
  }

  _createAssociation(associatedSchema, {
    foreignTable,
    foreignHash,
    foreignKey,
    useTargetKey,
    useSourceKey,
  } = {}, associationType) {
    const schema = this;
    const objectType = /many/i.test(associationType) ? 'array' : 'object';
    const has = !!/has/i.test(associationType);
    // const belongs = !!/belongs/i.test(associationType);
    const source = has ? schema : associatedSchema;
    const target = has ? associatedSchema : schema;
    return new Association({
      from: schema.name,
      to: associatedSchema.name,
      targetTable: target.tableName,
      targetHash: target.tableHash,
      targetKey: target._getPrimaryKeyName(),
      sourceTable: source.table,
      sourceHash: source.tableHash,
      sourceKey: source._getPrimaryKeyName(),
      foreignTable,
      foreignHash,
      foreignKey,
      useTargetKey,
      useSourceKey,
      objectType,
      using: [],
      associationType,
    });
  }

  hasOne(schema, options) {
    this.has[schema.name] = this._createAssociation(schema, options, 'hasOne');
  }

  hasMany(schema, options) {
    this.has[schema.name] = this._createAssociation(schema, options, 'hasMany');
  }

  belongsTo(schema, options) {
    this.belongs[schema.name] = this._createAssociation(schema, options, 'belongsTo');
  }

  belongsToMany(schema, options) {
    this.has[schema.name] = this._createAssociation(schema, options, 'belongsToMany');
  }
}

module.exports = Schema;
