const SchemaList = require('./schema/schema-list');
const QueryList = require('./query/query-list');
const debug = require('./debug');

// ! must disable it later.
debug.disableWarn();

class GraphLite {

  constructor(opts = {}) {
    this.schemaList = new SchemaList({
      schemas: opts.schemas,
    });
    this.queryList = new QueryList({
      queries: opts.queries,
    });
  }

  useConnection(connectionProvider) {

  }

  // Public API
  findOne(queryName, options = {}, extraOptions = {}) {
    extraOptions.size = 1;
    debug.log(queryName, options, extraOptions);
  }

  findAll(queryName, options = {}, extraOptions = {}) {
    debug.log(queryName, options, extraOptions);
  }

}

module.exports = GraphLite;