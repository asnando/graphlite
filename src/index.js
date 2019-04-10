const _ = require('./utils');
const Schema = require('./schema');
const Query = require('./query/query');
const debug = require('./debugger');
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

  findOne(queryName, filter = {}) {
    
  }

  findAll(queryName, filter = {}, options = {}) {

    // Merge filter options and options object(with page, size and some extra options).
    options = _.xtend({}, {
      page: options.page,
      size: options.size
    }, filter);

    const query = this._queries.find(query => query.name === queryName);

    if (!query) {
      throw new Error(`Undefined "${queryName}" query.`);
    }

    let buildedQuery, perf;
    let queryBuildTime, queryExecuteTime;

    perf = Date.now();

    try {
      buildedQuery = query.build(options);
      query.parseResponse();
      queryBuildTime = (Date.now() - perf) / 1000;
    } catch (exception) {
      throw new Error(`Caught an error building the query:\n\t${exception}`);
    }

    perf = Date.now();

    return this.executeBuildedQuery(buildedQuery).then(rows => {
      rows = query.parseResponse(rows);
      queryExecuteTime = (Date.now() - perf) / 1000;
      return {
        rows,
        buildedIn: queryBuildTime,
        executedIn: queryExecuteTime,
        parsedIn: 0
      };
    });
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

  executeBuildedQuery(query) {
    return this._connection.run(query).then(this.parseResponse);
  }

  parseResponse(data) {
    return data.map(object => JSON.parse(object.response));
  }

  executeRawQuery(query) {
    return this.connection.run(query);
  }

}

module.exports = GraphLite;

