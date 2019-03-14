const debug = require('./debugger');
const  _ = require('./utils/');
const Association = require('./association');

class Schema {

  constructor(name, opts) {
    this.name = name;
    this.tableName = opts.tableName;
    this.hash = _.createHashCode();
    this.properties = this._createSchemaProperties(opts.properties);
    this.hasManyRelationsWith = {};
    this.hasOneRelationWith = {};
    this.belongsToOneRelation = {};
    this.belongsToManyRelations = {};
  }

  _createSchemaProperties(props) {
    props = _.keys(props).map(keyName => {
      return this._createSchemaProperty(keyName, props[keyName])
    });
    // Schemas usually have a primary key. Warn developer if
    // this property is missing.
    if (!props.find(prop => prop.type === 'primaryKey')) {
      debug.warn(`[WARN] Missing primary key for "${this.name}" schema.`);
    }
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
      parser:   propDef.parse,
    });

    if (propType === 'primaryKey') {
      this.primaryKey = property.name;
    }

    return property;
  }

  _createAssociation(schema, options, associationType) {
    const has = /^has/.test(associationType);
    const belongs = /^belongs/.test(associationType);
    return new Association({
      targetHash:   belongs ? this.hash : schema.hash,
      targetTable:  belongs ? this.tableName : schema.tableName,
      targetKey:    belongs ? this.primaryKey : schema.primaryKey,
      sourceHash:   belongs ? schema.hash : this.hash,
      sourceTable:  belongs ? schema.tableName : this.tableName,
      sourceKey:    belongs ? schema.primaryKey : this.primaryKey,
      foreignTable: options.foreignTable,
      foreignKey:   options.foreignKey,
      objectType:   /many/i.test(associationType) ? 'array' : 'object',
      associationType,
      grouped: options.grouped,
    });
  }

  hasMany(schema, options = {}) {
    this.hasManyRelationsWith[schema.name] = this._createAssociation(schema, options, 'hasMany');
  }

  hasOne(schema, options = {}) {
    this.hasOneRelationWith[schema.name] = this._createAssociation(schema, options, 'hasOne');
  }

  belongsTo(schema, options = {}) {
    this.belongsToOneRelation[schema.name] = this._createAssociation(schema, options, 'belongsTo');
    // As the merge association options is not yet implemented it
    // uses a method "extendOptions" to override the options of the parent
    // association with this schema.
    const parentRelation = schema.hasManyRelationsWith[this.name] || schema.hasOneRelationWith[this.name];
    if (parentRelation) {
      parentRelation.extendOptions(options);
    } 
  }

  belongsToMany(schema, options = {}) {
    this.belongsToManyRelations[schema.name] = this._createAssociation(schema, options, 'belongsToMany');
    // As the merge association options is not yet implemented it
    // uses a method "extendOptions" to override the options of the parent
    // association with this schema.
    const parentRelation = schema.hasManyRelationsWith[this.name] || schema.hasOneRelationWith[this.name];
    if (parentRelation) {
      parentRelation.extendOptions(options);
    } 
  }

  haveAssociationWithParent(parent) {
    return !!(this._getDirectAssociationWith(parent) || this._getRelatedAssociationWith(parent));
  }

  getAssociationWithParent(schema) {
    return this._getDirectAssociationWith(schema) || this._getRelatedAssociationWith(schema);
  }

  getAssociationFromParent(schema) {
    return this.getAssociationFrom(schema.name);
  }

  _getDirectAssociationWith(schema) {
    const belongsToKeys = getAssociationToKeys(this);
    const association = belongsToKeys.includes(schema.name);
    return !association ? null :
      (this.belongsToManyRelations[schema.name] || this.belongsToOneRelation[schema.name]);
  }

  _getRelatedAssociationWith(schema) {
    const belongsToKeys = getAssociationToKeys(this);
    const hasKeys = getAssociationFromKeys(schema);

    // In some cases schemas are associated with each other throught another
    // associations. In that cases the "middle" associations will be added into the
    // parent and child associations.
    const middleAssociationMatch = hasKeys.find(key => belongsToKeys.includes(key));

    if (!middleAssociationMatch) return null;

    const middleAssociation = schema.hasManyRelationsWith[middleAssociationMatch] || schema.hasOneRelationWith[middleAssociationMatch];

    function createMiddleAssociation(association) {
      return new Association({
        sourceHash: association.sourceHash,
        sourceTable: association.sourceTable,
        sourceKey: association.sourceKey,
        targetHash: this.hash,
        targetTable: this.tableName,
        targetKey: this.primaryKey,
        throught: association,
        associationType: association.associationType,
        objectType: association.objectType
      });
    }

    if (schema.hasManyRelationsWith[middleAssociationMatch]) {
      this.belongsToManyRelations[schema.name] = createMiddleAssociation.call(this, middleAssociation);
    }
    
    if (schema.hasOneRelationWith[middleAssociationMatch]) {
      this.belongsToOneRelation[schema.name] = createMiddleAssociation.call(this, middleAssociation);
    }

    return this.getAssociationWith(schema.name);
  }

  getAssociationFrom(name) {
    return this.hasManyRelationsWith[name] || this.hasOneRelationWith[name];
  }

  getAssociationWith(name) {
    return this.belongsToManyRelations[name] || this.belongsToOneRelation[name];
  }

}

// Returns child.belongs*
function getAssociationToKeys(schema) {
  return _.keys(schema.belongsToManyRelations).concat(_.keys(schema.belongsToOneRelation));
}

// Returns parent.has*
function getAssociationFromKeys(schema) {
  return _.keys(schema.hasManyRelationsWith).concat(_.keys(schema.hasOneRelationWith));
}

module.exports = Schema;