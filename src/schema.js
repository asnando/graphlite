const debug = require('./utils/debug'),
      warn = require('./utils/warn'),
      alert = require('./utils/alert');

const  _ = require('./utils/');

class Schema {

  constructor(opts) {
    this.name = opts.name;
    this.tableName = opts.tableName;
    this.hash = _.createHashCode();
    this.properties = this._createSchemaProperties(opts.properties);
    this.hasMany = opts.hasMany;
    this.hasOne = opts.hasOne;
    // debug('***');
    // debug(this);
    // debug(this._resolveProperties());
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

    function resolveProperty(prop) {
      const tableNamePrefix = this.tableName.concat('.');

      const resolvedPropValue = prop.resolve
        ? `CASE ${prop.resolve.map(prop => `WHEN ${tableNamePrefix}${prop} IS NOT NULL THEN ${tableNamePrefix}${prop}`).join(' ')} END`
        : prop.join ? prop.join.map(prop => tableNamePrefix.concat(prop)).join(' || ')
        : tableNamePrefix.concat(prop.alias || prop.name);

      return [
        _.quote(_.equals(prop.type, 'primaryKey') ? '_id' : prop.name),
        resolvedPropValue
      ].join(',');
    }

    let schemaProperty = _.pickBy({
      name: primaryKey ? primaryKeyName : _.defaults(propDef.name, propName),
      type: primaryKey ? 'primaryKey' : _.defaults(propDef.type, 'default'),
      alias: propDef.alias,
      resolve: propDef.resolve,
      join: propDef.join,
    });

    schemaProperty.resolver = resolveProperty.bind(this, schemaProperty);

    return schemaProperty;
  }

  _resolveProperties(withId = true) {
    return this.properties
      // Do not bring the primary key field when "withId" is false
      .filter(prop => _.equals(withId, false) ? (prop.type !== 'primaryKey') : true)
      .map(prop => prop.resolver()).join(',');
  }

}

module.exports = Schema;