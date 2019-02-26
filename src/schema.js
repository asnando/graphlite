const debug = require('./utils/debug');
const warn = require('./utils/warn');
const  _ = require('./utils/');

class Schema {

  constructor(opts) {
    _.xtend(this, {
      name: opts.name,
      tableName: opts.tableName,
      hash: _.createHashCode(),
      idPropertyName: opts.idFieldNamePrefix.concat(opts.tableName),
      properties: this._createSchemaProperties(opts.properties, opts.tableName, opts.idFieldNamePrefix),
      hasMany: opts.hasMany,
      hasOne: opts.hasOne
    });
  }

  _createSchemaProperties(props, tableName, idFieldNamePrefix) {
    return [{
      name: "_id",
      alias: idFieldNamePrefix.concat(tableName),
      type: "number"
    }].concat(
      _.keys(props).map(keyName => this._createSchemaProperty(keyName, props[keyName]))
    );
  }

  _createSchemaProperty(propName, propDef) {
    return {
      name: propName,
      type: _.isString(propDef) ? propDef : propDef.type || 'default',
      alias: propDef.alias,
      resolve: propDef.resolve,
      join: propDef.join
    };
  }

  _getHashCode() {
    return this.hash;
  }

}

module.exports = Schema;