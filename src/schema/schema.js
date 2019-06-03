const assign = require('lodash/assign');
const isString = require('lodash/isString');
const jset = require('lodash/set');
const keys = require('lodash/keys');
const size = require('lodash/size');
const intersection = require('lodash/intersection');
const hashCode = require('../utils/hash-code');
const Association = require('./association');
const SchemaProperty = require('./schema-property');
const constants = require('../constants');
const debug = require('../debug');

const {
  GRAPHLITE_PRIMARY_KEY_DATA_TYPE,
  ID_PROPERTY_KEY_NAME,
} = constants;

const isPrimaryKeyDefined = props => !!keys(props).find((propName) => {
  const prop = props[propName];
  return GRAPHLITE_PRIMARY_KEY_DATA_TYPE === (isString(prop) ? prop : prop.type);
});

const isIdPropName = propName => (propName === ID_PROPERTY_KEY_NAME);

class Schema {
  constructor({
    name,
    tableName,
    tableHash,
    properties,
  }, schemaList) {
    if (!isString(name)) {
      throw new Error('Schema must have a unique name. The name is missing or is not a string.');
    }
    assign(this, {
      name,
      tableName,
      tableHash: tableHash || hashCode(),
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
    keys(props)
      .map((propName) => {
        const prop = props[propName];
        return isString(prop)
          ? { name: propName, type: prop }
          : { ...prop, name: propName, defaultValue: prop.default };
      })
      .forEach(({
        name,
        type,
        alias,
        parser,
        useLocale,
        defaultValue,
      }) => {
        const prop = new SchemaProperty({
          name,
          type,
          alias,
          parser,
          useLocale,
          defaultValue,
          schemaName: this.name,
          tableAlias: this.getTableHash(),
        });
        jset(this.properties, prop.getPropertyName(), prop);
      });
  }

  getSchemaName() {
    return this.name;
  }

  getProperty(propName) {
    return this.properties[propName];
  }

  getAllProperties() {
    return this.properties;
  }

  // This function might be used by QuerySchema class to acess a list of
  // schema defined properties names.
  getAllPropertiesNamesList(ignoreId = false) {
    const props = keys(this.properties);
    return ignoreId ? props.filter(propName => isIdPropName(propName)) : props;
  }

  translateToProperty(propName) {
    const prop = this.getProperty(propName);
    if (!prop) {
      throw new Error(`Undefined "${propName}" property on "${this.getSchemaName()}" schema.`);
    }
    return prop;
  }

  resolveSchemaPropertiesNamesList(ignoreId = false, useProperties = []) {
    // Get a list of all properties names from schema.
    const allProps = this.getAllPropertiesNamesList();
    // Merge props using the "useProperties" array(when defined).
    let props = size(useProperties) ? intersection(allProps, useProperties) : allProps;
    // If id must be ignored then return its property name from the array.
    if (ignoreId) {
      props = props.filter(propName => !isIdPropName(propName));
    } else {
      // Otherwise check if id property name is not defined and define it.
      const hasDefinedId = !!props.find(propName => isIdPropName(propName));
      props = !hasDefinedId ? [ID_PROPERTY_KEY_NAME].concat(props) : props;
    }
    return props;
  }

  getPrimaryKey() {
    const props = this.properties;
    let pk = keys(props).find(propName => props[propName].type === GRAPHLITE_PRIMARY_KEY_DATA_TYPE);
    pk = !pk ? pk : props[pk];
    return pk;
  }

  getPrimaryKeyName() {
    return this.getPrimaryKey().getPropertyName();
  }

  getPrimaryKeyColumnName() {
    return this.getPrimaryKey().getPropertyColumnName();
  }

  getTableName() {
    return this.tableName;
  }

  getTableHash() {
    return this.tableHash;
  }

  getTableAlias() {
    return this.tableHash;
  }

  getAssociationWith(schemaName) {
    const schema = this.getSchemaFromList(schemaName);
    return this.has[schemaName] || this.belongs[schemaName] || schema.getAssociationWith(this.name);
  }

  getSchemaFromList(schemaName) {
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
      targetKey: target.getPrimaryKeyColumnName(),
      sourceTable: source.getTableName(),
      sourceHash: source.getTableHash(),
      sourceKey: source.getPrimaryKeyColumnName(),
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
