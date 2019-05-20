const _ = require('lodash');
const hashCode = require('../utils/hash-code');
const SchemaProperty = require('./schema-property');

class Schema {

  constructor(schema) {

    if (!_.isString(schema.name)) {
      throw new Error(`Schema must have a unique name. The name is missing or is not a string.`);
    }

    _.assign(this, {
      name: schema.name,
      tableName: schema.tableName,
      tableHash: hashCode(),
      properties: {},
    });

    this._definePropertiesFromList(schema.properties);
  }

  _definePropertiesFromList(props = {}) {
    _.keys(props).forEach(propName => {

      const prop = _.assign(props[propName], {
        name: propName,
        schema: this.name
      });

      _.set(this.properties, propName, new SchemaProperty(prop));
    });
  }

}

module.exports = Schema;