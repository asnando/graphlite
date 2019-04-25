const _ = require('./utils');
const Schema = require('./schema');
const Query = require('./query/query');
const debug = require('./debugger');

const _const = require('./constants');

const {
  DEFAULT_ROW_NAME,
  DEFAULT_ROW_COUNT_NAME,
  DEFAULT_OBJECT_RESPONSE_NAME,
  DEFAULT_COUNT_OBJECT_RESPONSE_NAME,
  DEFAULT_TOTAL_COUNT_OBJECT_RESPONSE_NAME,
  DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME,
  DEFAULT_OPTIONS_PAGE,
} = _const;

const defaultProps = {
  _connection: null,
  _schemas: [],
  _queries: [],
  _options: {}
};

class GraphLite {

  constructor(opts) {
    // Create initial state of options.
    Object.assign(this, defaultProps);

    this._connection = _.defaults(opts.connection, this._connection);

    this._schemas = _.defaults(opts.schemas, this._schemas, (schemas) => {
      return schemas.map(schema => this.defineSchema(schema));
    });

    // If property 'associations' refers to a function, transform
    // the array of schemas into a object and pass it down to that function.
    // The function is responsible to make all the associations using the schemas
    // respective methods.
    if (_.isFunction(opts.associations)) {
      function translateSchemasToObjectList(schemas) {
        const object = {};
        schemas.forEach(schema => object[schema.name] = schema);
        return object;
      }
      opts.associations(translateSchemasToObjectList(this._schemas));
    }

    this._queries = _.defaults(opts.queries, this._queries, (queries) => {
      return queries.map(query => this.defineQuery(query));
    });
  }

  _schemaProvider(schemaName) {
    return this._schemas.find(schema => schema.name === schemaName);
  }

  // Extra options(b) represents the second object received by the find
  // functions. In this object there are page, size and some extra params.
  _mergeOptions(a = {}, b = {}) {
    return _.pickBy(_.xtend({}, a, {
      page: b.page || DEFAULT_OPTIONS_PAGE,
      size: b.size,
      withCount: b.withCount
    }));
  }

  getQueryByName(queryName) {
    return this._queries.find(query => query.name === queryName);
  }

  _executeQueryOnDatabase(query) {
    const connectionProviderQueryRunnerName = DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME;
    if (!this._connection) {
      throw new Error(`There is no database connection to run the query!`);
    } else if (!_.isFunction(this._connection[connectionProviderQueryRunnerName])) {
      throw new Error(`Unknown "${connectionProviderQueryRunnerName}" method on the connection provider instance!`);
    }
    return this._connection[connectionProviderQueryRunnerName](query);
  }

  _parseRowsFromDatabase(rows, rowObjectName) {
    rows = rows.map(row => JSON.parse(row[rowObjectName]));
    // Specific: When rows represent the total count of the collection,
    // it just return the first row value (which contains the count).
    return (rowObjectName === DEFAULT_ROW_COUNT_NAME) ? rows[0] : rows;
  }

  _translateRowsToObject(rows, responseObjectName) {
    return { [responseObjectName]: rows };
  }

  _executeQueryWithOptions(queryName, options = {}) {
    // Resolve query schema from the list.
    const query = this.getQueryByName(queryName);

    // Check if query really exists.
    if (!query) throw new Error(`Undefined ${queryName} query!`);

    // Must build and run a specific query for total count?
    const withCount = (_.isBoolean(options.count) && !options.count) ? false : (options.page === 1) ? true : false;

    // #
    const buildAndRunQuery = () => {
      const buildedQuery = query.buildQuery(options);
      return this._executeQueryOnDatabase(buildedQuery)
        .then(rows => this._parseRowsFromDatabase(rows, DEFAULT_ROW_NAME))
        .then(rows => query.parseRows(rows))
        .then(rows => this._translateRowsToObject(rows, DEFAULT_OBJECT_RESPONSE_NAME));
    }

    // #
    const buildAndRunCountQuery = (data) => {
      const buildedCountQuery = query.buildCountQuery(options);
      return this._executeQueryOnDatabase(buildedCountQuery)
        .then(rows => this._parseRowsFromDatabase(rows, DEFAULT_ROW_COUNT_NAME))
        .then(rows => this._translateRowsToObject(rows, DEFAULT_TOTAL_COUNT_OBJECT_RESPONSE_NAME))
        .then(rows => _.xtend(rows, data));
    }

    const tasks = [
      buildAndRunQuery,
      withCount ? buildAndRunCountQuery : null
    ];

    // Execute query list sync then return.
    return tasks.reduce((promise, task) => {
      return promise = promise.then(task);
    }, Promise.resolve())
    .then(data => {
      // Manual add 'count' property within the data rows length;
      return _.xtend(data, {
        [DEFAULT_COUNT_OBJECT_RESPONSE_NAME]: data[DEFAULT_OBJECT_RESPONSE_NAME].length
      });
    });
  }

  // ## Public methods
  findOne(queryName, options = {}, extraOptions = {}) {
    extraOptions.size = 1;
    return this._executeQueryWithOptions(queryName, this._mergeOptions(options, extraOptions));
  }

  findAll(queryName, options = {}, extraOptions = {}) {
    return this._executeQueryWithOptions(queryName, this._mergeOptions(options, extraOptions));
  }

  defineSchema(name, opts) {
    const schemaProvider = this._schemaProvider.bind(this);
    opts = _.isObject(name) ? name : opts;
    name = _.isObject(name) ? name.name : name;
    const schema = new Schema(name, opts, schemaProvider);
    this._schemas.push(schema);
    return schema;
  }

  defineQuery(name, graph) {
    const schemaProvider = this._schemaProvider.bind(this);
    graph = _.isObject(name) ? name : graph;
    name = _.isObject(name) ? name.name : name;
    
    // Delete the name property of the graph. The query graph will
    // interpret that property as a alias for one of defined schemas instead
    // of a configuration property.
    delete graph.name;

    const query = new Query(name, graph, schemaProvider);
    this._queries.push(query);
    return query;
  }

}

module.exports = GraphLite;

