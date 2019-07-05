const size = require('lodash/size');
const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const jset = require('lodash/set');
const Query = require('./query');
// const debug = require('../debug');

class QueryList {
  constructor(opts = {}) {
    this.queries = {};
    if (isArray(opts.queries)) {
      this._defineQueriesFromArrayList(opts.queries);
    }
  }

  _defineQueriesFromArrayList(queries) {
    return queries.forEach(query => this.defineQuery(query));
  }

  defineQuery(...args) {
    const query = size(args) === 2 ? args[1] : args[0];
    if (!isString(query.name) && size(args) === 2) {
      const [queryName] = args;
      query.name = queryName;
    }
    // Register the query.
    const queryName = query.name;
    const mainQuery = new Query(query);
    jset(this.queries, queryName, mainQuery);
    // Register another query for total rows count.
    const countQueryName = `${queryName}-count`;
    const countQuery = new Query({
      ...query,
      name: countQueryName,
      type: 'count',
    });
    jset(this.queries, countQueryName, countQuery);
    return mainQuery;
  }

  getQuery(queryName) {
    if (!this.queries[queryName]) {
      throw new Error(`Undefined "${queryName}" query.`);
    }
    return this.queries[queryName];
  }
}

module.exports = QueryList;
