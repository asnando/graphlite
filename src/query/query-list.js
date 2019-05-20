const _ = require('lodash');
const Query = require('./query');

class QueryList {

  constructor(opts = {}) {
    this.queries = {};
    if (_.isArray(opts.queries)) {
      this._defineQueriesFromArrayList(opts.queries);
    }
  }

  _defineQueriesFromArrayList(queries) {
    return queries.forEach(query => this.defineQuery(query));
  }

  defineQuery(queryName, query) {
    query = _.size(arguments) === 2 ? arguments[1] : arguments[0];

    if (!_.isString(query.name) && _.size(arguments) === 2) {
      query.name = arguments[0];
    }

    return _.set(this.queries, query.name, new Query(query));
  }

  getQuery(queryName) {
    if (!this.queries[queryName]) {
      throw new Error(`Undefined "${queryName}" schema`);
    }
  }

}

module.exports = QueryList;