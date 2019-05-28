const assign = require('lodash/assign');
const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const keys = require('lodash/keys');
const pbcopy = require('clipboardy');
const debug = require('./debug');
const schemaList = require('./jar/schema-list');
const queryList = require('./jar/query-list');
const formatQuery = require('./utils/query');

const constants = require('./constants');

const {
  RESPONSE_OBJECT_NAME,
  GRAPHLITE_CONNECTION_EXECUTER_NAME,
} = constants;

const parseDatabaseReponse = (rows) => {
  rows = rows.map(row => JSON.parse(row[RESPONSE_OBJECT_NAME]));
  return {
    rows,
  };
}

class GraphLite {
  constructor({
    schemas,
    queries,
    associations,
    locales,
    defaultLanguage,
    connection,
  }) {
    const supportedLocales = isObject(locales) ? keys(locales) : {};

    assign(this, {
      connection,
      schemaList,
      queryList,
      supportedLocales,
      locales,
      locale: defaultLanguage || supportedLocales[0],
    });

    this._defineSchemasFromArrayList(schemas);
    this._useAssociationFunction(associations);
    this._defineQueriesFromArrayList(queries);
  }

  _defineSchemasFromArrayList(schemas = []) {
    schemas.forEach(schema => this.schemaList.defineSchema(schema));
  }

  _defineQueriesFromArrayList(queries = []) {
    queries.forEach(query => this.queryList.defineQuery(query));
  }

  _useAssociationFunction(useAssociation) {
    if (isFunction(useAssociation)) {
      const schemas = this.schemaList.getSchemaList();
      useAssociation(schemas);
    }
  }

  _getQuery(queryName) {
    return this.queryList.getQuery(queryName);
  }

  _mountQuery(queryName, options = {}, extraOptions = {}) {
    const query = this._getQuery(queryName);
    // !
    const mergeOptionsObject = (a, b) => assign(a, b);
    const mergedOptions = mergeOptionsObject(options, extraOptions);
    const resolvedQuery = formatQuery(query.resolve(mergedOptions));
    // debug.log(resolvedQuery);
    pbcopy.writeSync(resolvedQuery);
    return resolvedQuery;
  }

  _executeQuery(query) {
    const { connection } = this;
    if (isFunction(connection)) {
      return connection(query);
    }
    return connection[GRAPHLITE_CONNECTION_EXECUTER_NAME](query);
  }

  _run(queryName, options = {}, extraOptions = {}) {
    const query = this._mountQuery(queryName, options, extraOptions);
    return this._executeQuery(query).then(parseDatabaseReponse);
  }

  // Public API
  findOne(...args) {
    // assign(extraOptions, 'size', 1);
    return this._run(...args);
  }

  findAll(...args) {
    return this._run(...args);
  }

  setLocale(locale) {
    const { locales } = this;
    if (!locales.includes(locale)) {
      throw new Error(`Unsupported locale "${locale}".`);
    }
    this.locale = locale;
  }
}

module.exports = GraphLite;
