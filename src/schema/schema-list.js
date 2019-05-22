const isArray = require('lodash/isArray');
const size = require('lodash/size');
const isString = require('lodash/isString');
const jset = require('lodash/set');
// const debug = require('../debug');
const Schema = require('./schema');

class SchemaList {
  constructor(opts = {}) {
    this.schemas = {};
    if (isArray(opts.schemas)) {
      this._defineSchemasFromArrayList(opts.schemas);
    }
  }

  _defineSchemasFromArrayList(schemas = []) {
    return schemas.forEach(schema => this.defineSchema(schema));
  }

  defineSchema(...args) {
    const schema = size(args) === 2 ? args[1] : args[0];
    if (!isString(schema.name) && size(args) === 2) {
      const [schemaName] = args;
      schema.name = schemaName;
    }
    return jset(this.schemas, schema.name, new Schema(schema));
  }

  getSchema(schemaName) {
    if (!this.schemas[schemaName]) {
      throw new Error(`Undefined "${schemaName}" schema`);
    }
    return this.schemas[schemaName];
  }

  getSchemaList() {
    return this.schemas;
  }
}

module.exports = SchemaList;
