const isArray = require('lodash/isArray');
const size = require('lodash/size');
const isString = require('lodash/isString');
const jset = require('lodash/set');
const keys = require('lodash/keys');
const Schema = require('./schema');
const debug = require('../debug');

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
    return jset(this.schemas, schema.name, new Schema(schema, this));
  }

  getSchema(schemaName) {
    if (!this.schemas[schemaName]) {
      throw new Error(`Undefined "${schemaName}" schema`);
    }
    return this.schemas[schemaName];
  }

  getSchemaByAlias(hash) {
    const { schemas } = this;
    const match = keys(schemas).find(schemaName => (schemas[schemaName].getTableHash() === hash));
    return match ? this.schemas[match] : null;
  }

  getSchemaList() {
    return this.schemas;
  }
}

module.exports = SchemaList;
