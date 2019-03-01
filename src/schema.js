const debug = require('./utils/debug'),
      warn = require('./utils/warn'),
      alert = require('./utils/alert');

const  _ = require('./utils/');

class Schema {

  constructor(name, opts) {
    this.name = name;
    this.tableName = opts.tableName;
    this.hash = _.createHashCode();
    this.properties = this._createSchemaProperties(opts.properties);
    this.has = { many: {}, one: {} };
    this.belongs = { many: {}, one: {} };
  }

  _createSchemaProperties(props) {
    props = _.keys(props).map(keyName => {
      return this._createSchemaProperty(keyName, props[keyName])
    });
    // Schemas usually have a primary key. Warn developer if
    // this property is missing.
    if (!props.find(prop => prop.type === 'primaryKey')) {
      warn(`[WARN] Missing primary key for "${this.name}" schema.`);
    }
    return props;
  }

  _createSchemaProperty(propName, propDef) {
    let primaryKey, primaryKeyName;
    
    primaryKey = (_.isString(propDef) && _.equals(propDef, 'primaryKey')) ||
      (_.isObject(propDef) && _.equals(propDef.type, 'primaryKey'));

    primaryKeyName = !primaryKey ? null : _.isString(propDef) ? propName : propDef.name || propName;

    const property = _.pickBy({
      name: primaryKey ? primaryKeyName : _.defaults(propDef.name, propName),
      type: primaryKey ? 'primaryKey' : _.defaults(propDef.type, 'default'),
      alias: propDef.alias,
      resolver: propDef.resolve,
      join: propDef.join,
      parser: propDef.parse,
    });

    if (primaryKey) this.primaryKey = property.name;

    return property;
  }

  _resolveTableName() {
    return this.tableName;
  }

  _resolveProperties(withId = true) {
    return this.properties
      // Do not bring the primary key field when "withId" is false
      .filter(prop => _.equals(withId, false) ? (prop.type !== 'primaryKey') : true)
      .map(prop => {
        // This function will be called by each property in the schema
        // and will resolves the property definition that is used inside the 
        // select section of the query.
        return [
          _.quote(_.equals(prop.type, 'primaryKey') ? '_id' : prop.name),
          prop.resolver
            ? propDefinitionWithResolver(this.tableName, prop.resolver)
            : prop.join
              ? propDefinitionWithJoin(this.tableName, prop.join)
              : propDefinition(this.tableName, prop.alias, prop.name)
        ].join(',');
      })
      .join(',');
  }

  hasMany(schema, options = {}) {
    options.associationType = 'array';
    this.has.many[schema.name] = { schema, options };
  }

  hasOne(schema, options = {}) {
    options.associationType = 'object';
    this.has.one[schema.name] = { schema, options };
  }

  belongsTo(schema, options = {}) {
    options.associationType = 'object';
    this.belongs.one[schema.name] = { schema, options };
  }

  belongsToMany(schema, options = {}) {
    options.associationType = 'array';
    this.belongs.many[schema.name] = { schema, options };
  }

}

function propDefinitionWithResolver(tableName, resolver) {
  return `CASE ${resolver.map(prop => `WHEN ${tableName}${prop} IS NOT NULL THEN ${tableName}${prop}`).join(' ')} END`;
}

function propDefinitionWithJoin(tableName, join) {
  return join.map(prop => tableName.concat(prop)).join(' || ');
}

function propDefinition(tableName, alias, name) {
  return tableName.concat(alias || name);
}

module.exports = Schema;