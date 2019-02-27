const _ = require('./utils');
const debug = require('./utils/debug');
const warn = require('./utils/warn');
const Schema = require('./schema');
const Query = require('./query');
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

  test(queryName, queryOpts) {
    const query = this._queries.find(query => query.name === queryName);
    query.build(queryOpts);
  }

  _schemaProvider(schemaName) {
    return this._schema.find(schema => schema.name === schemaName);
  }

  defineSchema(schema) {
    this._schema.push(new Schema(schema));
    return this;
  }

  defineQuery(query) {
    const schemaProvider = this._schemaProvider.bind(this);
    this._queries.push(new Query(_.xtend(query, { schemaProvider })));
    return this;
  }

}

module.exports = GraphLite;