const assign = require('lodash/assign');
const isString = require('lodash/isString');
const jset = require('lodash/set');
const keys = require('lodash/keys');
const hashCode = require('../utils/hash-code');
const Association = require('./association');
const SchemaProperty = require('./schema-property');
const constants = require('../constants');
const debug = require('../debug');

const {
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
} = constants;

const isPrimaryKeyDefined = props => !!keys(props).find((propName) => {
  const prop = props[propName];
  return GRAPHLITE_PRIMARY_KEY_DATA_TYPE === (isString(prop) ? prop : prop.type);
});

class Schema {
  constructor({ name, tableName, properties }, schemaList) {
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
      // schemaList reference must be saved inside this class instance because
      // the SchemaList class depends on this class. So, when we need access to the schema
      // list jar we can access throught it.
      schemaList,
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

  getSchemaName() {
    return this.name;
  }

  getPrimaryKey() {
    const props = this.properties;
    let pk = keys(props).find(propName => props[propName].type === GRAPHLITE_PRIMARY_KEY_DATA_TYPE);
    pk = !pk ? pk : props[pk];
    return pk;
  }

  getPrimaryKeyName() {
    return this.getPrimaryKey().name;
  }

  getPrimaryKeyColumnName() {
    const pk = this.getPrimaryKey();
    return pk.alias || pk.name;
  }

  getTableName() {
    return this.tableName;
  }

  getTableHash() {
    return this.tableHash;
  }

  getAssociationWith(schemaName) {
    const schema = this._getSchemaFromList(schemaName);
    return this.has[schemaName] || this.belongs[schemaName] || schema.getAssociationWith(this.name);
  }

  _getSchemaFromList(schemaName) {
    return this.schemaList.getSchema(schemaName);
  }

  _createAssociation(associatedSchema, {
    foreignTable,
    // foreignHash,
    foreignKey,
    useTargetKey,
    useSourceKey,
    join,
    using,
  } = {}, associationType) {
    const schema = this;
    const objectType = /many/i.test(associationType) ? 'array' : 'object';
    const has = !!/has/i.test(associationType);
    // const belongs = !!/belongs/i.test(associationType);
    const source = has ? schema : associatedSchema;
    const target = has ? associatedSchema : schema;
    return new Association({
      from: schema.getSchemaName(),
      to: associatedSchema.getSchemaName(),
      targetTable: target.getTableName(),
      targetHash: target.getTableHash(),
      targetKey: target.getPrimaryKeyName(),
      sourceTable: source.getTableName(),
      sourceHash: source.getTableHash(),
      sourceKey: source.getPrimaryKeyName(),
      foreignTable,
      // foreignHash,
      foreignKey,
      useTargetKey,
      useSourceKey,
      joinType: join,
      objectType,
      // "using" is an array that intermediates the association between two schemas. This
      // array receives the schemas names in the middle of the association.
      // The array is mutated within the real schema objects representations.
      using: (using || []).map(schemaName => this.getAssociationWith(schemaName)),
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
