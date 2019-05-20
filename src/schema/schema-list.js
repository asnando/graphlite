const _ = require('lodash');
const Schema = require('./schema');

class SchemaList {

  constructor(opts = {}) {
    this.schemas = {};
    if (_.isArray(opts.schemas)) {
      this._defineSchemasFromArrayList(opts.schemas);
    }
  }

  _defineSchemasFromArrayList(schemas = []) {
    return schemas.forEach(schema => this.defineSchema(schema));
  }

  defineSchema(schemaName, schema) {
    schema = _.size(arguments) === 2 ? arguments[1] : arguments[0];

    if (!_.isString(schema.name) && _.size(arguments) === 2) {
      schema.name = arguments[0];
    }

    return _.set(this.schemas, schema.name, new Schema(schema));
  }

  getSchema(schemaName) {
    if (!this.schemas[schemaName]) {
      throw new Error(`Undefined "${schemaName}" schema`);
    }
    return this.schemas[schemaName];
  }
  
}

module.exports = SchemaList;