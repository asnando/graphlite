const assign = require('lodash/assign');
const isString = require('lodash/isString');
const jset = require('lodash/set');
const keys = require('lodash/keys');
const hashCode = require('../utils/hash-code');
const debug = require('../debug');
const SchemaProperty = require('./schema-property');

class Schema {
  constructor(schema) {
    if (!isString(schema.name)) {
      throw new Error('Schema must have a unique name. The name is missing or is not a string.');
    }

    assign(this, {
      name: schema.name,
      tableName: schema.tableName,
      tableHash: hashCode(),
      properties: {},
    });

    this._definePropertiesFromList(schema.properties);
  }

  _definePropertiesFromList(props = {}) {
    keys(props).forEach((propName) => {
      const prop = assign(props[propName], {
        name: propName,
        schema: this.name,
      });
      jset(this.properties, propName, new SchemaProperty(prop));
    });
  }

  hasOne(...args) {
    return this;
  }

  hasMany(...args) {
    return this;
  }

  belongsTo(...args) {
    return this;
  }

  belongsToMany(...args) {
    return this;
  }
}

module.exports = Schema;
