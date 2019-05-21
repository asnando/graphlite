const schemaList = require('./schema/schema-list');
const queryList = require('./query/query-list');
const debug = require('./debug');

class GraphLite {

  constructor(opts = {}) {
    this.schemaList = new schemaList({
      schemas: opts.schemas
    });
    this.queryList = new queryList({
      queries: opts.queries
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