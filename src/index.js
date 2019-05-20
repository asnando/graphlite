const schemaList = require('./schema/schema-list');
const queryList = require('./query/query-list');

class GraphLite {

  constructor(opts = {}) {
    // console.log('Graphlite received options:', opts);
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
    console.log(queryName, options, extraOptions);
  }

  findAll(queryName, options = {}, extraOptions = {}) {
    console.log(queryName, options, extraOptions);
  }

}

module.exports = GraphLite;