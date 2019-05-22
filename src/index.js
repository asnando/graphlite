const assign = require('lodash/assign');
const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const keys = require('lodash/keys');
const debug = require('./debug');
const schemaList = require('./jar/schema-list');
const queryList = require('./jar/query-list');

// ! must disable it later.
debug.disableWarn();

class GraphLite {
  constructor({
    schemas,
    queries,
    associations,
    locales,
    defaultLanguage,
  }) {
    const supportedLocales = isObject(locales) ? keys(locales) : {};

    assign(this, {
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

  // Public API
  findOne(...args) {
    // assign(extraOptions, 'size', 1);
    return this._mountQuery(...args);
  }

  findAll(...args) {
    return this._mountQuery(...args);
  }

  _mountQuery(queryName, options = {}, extraOptions = {}) {
    const query = this._getQuery(queryName);
    // !
    const mergeOptionsObject = (a, b) => assign(a, b);
    const mergedOptions = mergeOptionsObject(options, extraOptions);
    const mountedQuery = query.resolve(mergedOptions);
    debug.log('mounted query:', mountedQuery);
    return Promise.resolve({});
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
