const _ = require('./utils');
const debug = require('./utils/debug');
const warn = require('./utils/warn');

const Schema = require('./schema');
const Query = require('./query');

const D_SQLITE_JSON1_ENABLED = false;
const ID_FIELD_NAME_PREFIX = 'Codigo';
class Graphlite {

  constructor(opts) {

    this._connection = opts.connection;

    this._options = {
      idFieldNamePrefix: ID_FIELD_NAME_PREFIX,
      json1Enabled: _.isDef(opts.json1Enabled) ? opts.json1Enabled : D_SQLITE_JSON1_ENABLED
    };

    this._schema = opts.schema.map(schema => new Schema(_.xtend(schema, {
      idFieldNamePrefix: this._options.idFieldNamePrefix
    })));

    this._queries = opts.queries.map(query => new Query(_.xtend(query, {
      schemaProvider: this._schemaProvider.bind(this),
      json1Enabled: this._options.json1Enabled,
    })));
  }

  _schemaProvider(schemaName) {
    return this._schema.find(schema => schema.name === schemaName);
  }

  test(queryName, queryOpts) {
    // warn(`Running "${queryName}"`);
    warn(`Searching query with name "${queryName}"...`);
    const query = this._queries.find(query => query.name === queryName);
    warn(`Found query "${queryName}"!`);
    // debug(query);
    warn(`Building query "${queryName}"...`);
    const resolvedQuery = query.build(queryOpts);
    warn(`Query builded:`, resolvedQuery);
  }

}

module.exports = Graphlite;