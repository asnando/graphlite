const assign = require('lodash/assign');
const Schema = require('../schema/schema');
const schemaList = require('../jar/schema-list');
const debug = require('../debug');

class QuerySchema extends Schema {
  constructor(opts = {}) {
    super(opts, schemaList);
    assign(this, {
      useProperties: opts.useProperties,
    });
  }

  getDefinedProperties() {
    debug.log(this.useProperties);
  }
}

module.exports = QuerySchema;
