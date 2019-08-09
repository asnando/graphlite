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

  defineQuery(struct) {
    const self = this;
    const pushToQuerylist = (queryName, query) => jset(self.queries, queryName, query);
    const createQuery = queryStruct => new Query(queryStruct);
    const { name: queryName } = struct;
    const countQueryName = `${queryName}-count`;
    const mainQuery = createQuery(struct);
    const countQuery = createQuery({
      ...struct,
      name: countQueryName,
      type: 'count',
    });
    pushToQuerylist(queryName, mainQuery);
    pushToQuerylist(countQueryName, countQuery);
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
