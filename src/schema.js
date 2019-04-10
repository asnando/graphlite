const debug = require('./debugger');
const  _ = require('./utils/');
const Association = require('./association');

class Schema {

  constructor(name, opts, schemaProvider) {
    this.schemaProvider = schemaProvider;
    this.name = name;
    this.tableName = opts.tableName;
    this.hash = _.createHashCode();
    this.properties = this._createSchemaProperties(opts.properties);
    this.has = {};
    this.belongs = {};
  }

  _createSchemaProperties(props) {
    props = _.keys(props).map(keyName => {
      return this._createSchemaProperty(keyName, props[keyName])
    });
    // // Schema must always declare one primary key property.
    // if (!props.find(prop => prop.type === 'primaryKey')) {
    //   throw new Error(`Missing primary key definition for "${this.name}" schema.`);
    // }
    return props;
  }

  _createSchemaProperty(propName, propDef) {
    const propType = _.isString(propDef) ? propDef : !!propDef.type ? propDef.type : 'default';

    const property = _.pickBy({
      name:     propName,
      type:     propType,
      alias:    propDef.alias,
      resolver: propDef.resolve,
      join:     propDef.join,
      parser:   propDef.parser,
    });

    if (propType === 'primaryKey') {
      this.primaryKey = property.name;
    }

    return property;
  }

  _createAssociation(schema, options, associationType) {
    const has = /^has/.test(associationType);
    const belongs = /^belongs/.test(associationType);
    const source = has ? this : belongs ? this : schema;
    const target = has ? schema : belongs ? schema : this;
    return new Association({
      schemaFrom:   this.name,
      schemaTo:     schema.name,
      targetHash:   target.hash,
      targetTable:  target.tableName,
      targetKey:    target.primaryKey,
      sourceHash:   source.hash,
      sourceTable:  source.tableName,
      sourceKey:    source.primaryKey,
      foreignTable: options.foreignTable,
      foreignKey:   options.foreignKey,
      objectType:   /many/i.test(associationType) ? 'array' : 'object',
      using:        (options.using || []).map(schemaName => this.schemaProvider(schemaName)),
      associationType,
    });
  }

  hasMany(schema, options = {}) {
    this.has[schema.name] = this._createAssociation(schema, options, 'hasMany');
  }

  hasOne(schema, options = {}) {
    this.has[schema.name] = this._createAssociation(schema, options, 'hasOne');
  }

  belongsTo(schema, options = {}) {
    this.belongs[schema.name] = this._createAssociation(schema, options, 'belongsTo');
  }

  belongsToMany(schema, options = {}) {
    this.belongs[schema.name] = this._createAssociation(schema, options, 'belongsToMany');
  }

  haveAssociationWith(schema) {
    const selfKeys = this._getAssociationKeys();
    const schemaKeys = schema._getAssociationKeys();
    return selfKeys.includes(schema.name) || schemaKeys.includes(this.name);
  }

  getAssociationOptionsWith(schema) {
    const association = this._getAssociation(schema, this);
    if (!association) {
      throw new Error(`No association found between "${schema.name}" and "${this.name}".`);
    }
    return !association.using.length ? association
      : this._resolveAssociationTree(schema, this, association);
  }

  _getAssociation(a, b) {
    // Directly access the external schema associations object.
    return (a.has[b.name] || a.belongs[b.name]) || (b.has[a.name] || b.belongs[a.name]);
    // return (a.has[b.name] || b.belongs[a.name]) || (b.has[a.name] || a.belongs[b.name]);
  }

  // Used when the association options contains the "using" key that must
  // resolve each association between the two schemas.
  _resolveAssociationTree(a, b, association) {
    // Note.: from parent to child.
    return [a, ...association.using, b].reduce((value, schema, index, self) => {
      if (!index) {
        return value;
      } else {
        const before = self[index - 1];
        const association = this._getAssociation(before, schema);
        return value.concat(association);
      }
    }, []);
  }

  _createAssociationShadow(association) {
    return {
      sourceHash:   association.sourceHash,
      sourceTable:  association.sourceTable,
      sourceKey:    association.sourceKey,
      targetHash:   association.targetHash,
      targetTable:  association.targetTable,
      targetKey:    association.targetKey,
      foreignTable: association.foreignTable,
      foreignKey:   association.foreignKey,
      objectType:   association.objectType,
      type:         association.type
    };
  }

  _getAssociationKeys(schema = this) {
    const h = _.keys(schema.has);
    const b = _.keys(schema.belongs);
    return {
      has: h,
      belongs: b,
      includes: (name) => [...h, ...b].includes(name),
    };
  }

}

module.exports = Schema;