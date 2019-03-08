const _ = require('./utils');
const Schema = require('./schema');
const Query = require('./query');
const debug = require('./debugger');
class GraphLite {

  constructor(opts) {
    this._connection = opts.connection;
    const options = {};
    this._schema = _.defaults(opts.schema, [], (schemas) => {
      return schemas.map(schema => this.defineSchema(schema));
    });
    this._queries = _.defaults(opts.queries, [], (queries) => {
      return queries.map(query => this.defineQuery(query));
    });
    this._options = options;
  }

  _schemaProvider(schemaName) {
    return this._schema.find(schema => schema.name === schemaName);
  }

  test(queryName, queryOpts = {}) {
    const query = this._queries.find(query => query.name === queryName);
    if (!query) throw new Error(`Undefined "${queryName}" query.`);
    query.build(queryOpts);
  }

  defineSchema(name, opts) {
    opts = _.isObject(name) ? name : opts;
    name = _.isObject(name) ? name.name : name;
    const schema = new Schema(name, opts);
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

  executeRawQuery(query) {
    return this.connection.run(query);
  }

}

module.exports = GraphLite;

