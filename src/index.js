const _ = require('./utils');
const Schema = require('./schema');
const Query = require('./query/query');
const debug = require('./debugger');

const DEFAULT_OBJECT_RESPONSE_NAME = 'response';
const DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME = 'run';

class GraphLite {

  constructor(opts) {
    _.xtend(this, {
      _connection: opts.connection,
      _schema: _.defaults(opts.schema, [], (schemas) => {
        return schemas.map(schema => this.defineSchema(schema));
      }),
      _queries: _.defaults(opts.queries, [], (queries) => {
        return queries.map(query => this.defineQuery(query));
      }),
      _options: {},
    });
  }

  _schemaProvider(schemaName) {
    return this._schema.find(schema => schema.name === schemaName);
  }

  // Extra options(b) represents the second object received by the find
  // functions. In this object there are page, size and some extra params.
  _mergeOptions(a = {}, b = {}) {
    return _.pickBy(_.xtend({}, a, {
      page: b.page,
      size: b.size
    }));
  }

  _getQueryByName(queryName) {
    return this._queries.find(query => query.name === queryName);
  }

  _parseRows(usedQuery, rows) {
    return usedQuery.parseRows(rows.map(object => JSON.parse(object[DEFAULT_OBJECT_RESPONSE_NAME])));
  }

  _translateToResponseObject(rows) {
    return {
      rows,
      buildedIn: 0,
      executedIn: 0,
      parsedIn: 0,
    };
  }

  _executeQueryOnDatabase(query) {
    return this._connection[DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME](query);
  }

  _executeQuery(rawQuery, query) {
    return this._executeQueryOnDatabase(rawQuery)
        .then(this._parseRows.bind(this, query))
        .then(this._translateToResponseObject.bind(this));
  }

  _executeQueryWithOptions(queryName, options = {}) {
    return new Promise((resolve, reject) => {

      // Resolve query schema from the list.
      const query = this._getQueryByName(queryName);
      if (!query) return reject(`Undefined "${queryName}" query`);

      let buildedQuery;

      // Try to build the query.
      try {
        buildedQuery = query.build(options);
      } catch (exception) {
        return reject(exception);
      }

      return this._executeQuery(buildedQuery, query).then(resolve);
    });
  }

  // ## Public methods
  findOne(queryName, filter = {}, options = {}) {
    options.size = 1;
    return this._executeQueryWithOptions(queryName, this._mergeOptions(filter, options));
  }

  findAll(queryName, filter = {}, options = {}) {
    return this._executeQueryWithOptions(queryName, this._mergeOptions(filter, options));
  }

  defineSchema(name, opts) {
    const schemaProvider = this._schemaProvider.bind(this);
    opts = _.isObject(name) ? name : opts;
    name = _.isObject(name) ? name.name : name;
    const schema = new Schema(name, opts, schemaProvider);
    this._schema.push(schema);
    return schema;
  }

  defineQuery(name, graph) {
    const schemaProvider = this._schemaProvider.bind(this);
    graph = _.isObject(name) ? name : graph;
    name = _.isObject(name) ? name.name : name;
    const query = new Query(name, graph, schemaProvider);
    this._queries.push(query);
    return query;
  }

}

module.exports = GraphLite;

