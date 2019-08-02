const assign = require('lodash/assign');
const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const size = require('lodash/size');
const schemaList = require('./jar/schema-list');
const queryList = require('./jar/query-list');
const parseCountResponse = require('./response/parse-count-response');
const parseResponseRows = require('./response/parse-response-rows');
const {
  GRAPHLITE_CONNECTION_EXECUTER_NAME,
  TOTAL_ROWS_COUNT_PROPERTY_NAME,
} = require('./constants');

class GraphLite {
  constructor({
    schemas,
    queries,
    associations,
    locales: useLocales,
    connection,
  }) {
    assign(this, {
      connection,
      locales: {
        ...useLocales,
        defaultLocale: isObject(useLocales) ? Object.keys(useLocales)[0] : null,
      },
    });
    this._defineSchemasFromArrayList(schemas);
    this._useAssociationFunction(associations);
    this._defineQueriesFromArrayList(queries);
  }

  _defineSchema(schema) {
    const { locales } = this;
    return schemaList.defineSchema({
      ...schema,
      // Pass locales configuration down to the Schema constructor
      // so it can pass it to properties and when request is made
      // the SchemaProperty can detect which multilang column name
      // to use based on the query prefered locale.
      locales,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  _defineQuery(query) {
    return queryList.defineQuery(query);
  }

  _defineSchemasFromArrayList(schemas = []) {
    schemas.forEach(schema => this._defineSchema(schema));
  }

  _defineQueriesFromArrayList(queries = []) {
    queries.forEach(query => this._defineQuery(query));
  }

  // eslint-disable-next-line class-methods-use-this
  _useAssociationFunction(useAssociation) {
    if (isFunction(useAssociation)) {
      const schemas = schemaList.getSchemaList();
      useAssociation(schemas);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _getQuery(queryName) {
    return queryList.getQuery(queryName);
  }

  _mountQuery(queryName, options = {}) {
    const query = this._getQuery(queryName);
    return query.resolve(options);
  }

  _mountCountQuery(queryName, options = {}) {
    const query = this._getQuery(`${queryName}-count`);
    return query.resolve(options);
  }

  _executeQuery(query) {
    const { connection } = this;
    return isFunction(connection)
      ? connection(query)
      : connection[GRAPHLITE_CONNECTION_EXECUTER_NAME](query);
  }

  _run(queryName, options = {}) {
    const {
      count: withCount = true,
      page = 1,
    } = options;
    const executeQuery = this._executeQuery.bind(this);
    const mainQuery = this._mountQuery(queryName, options);
    const countQuery = this._mountCountQuery(queryName, options);
    const fetchData = () => executeQuery(mainQuery).then(parseResponseRows);
    const shouldCount = !(withCount === false);
    const isFirstPage = page === 1;
    return fetchData().then((rows) => {
      // Run another query to count the total number of rows that can be listed by the query.
      if (isFirstPage && shouldCount) {
        const fetchDataCount = () => executeQuery(countQuery).then(parseCountResponse);
        // Merge the data from the two executed queries:
        return fetchDataCount().then(totalCount => ({
          ...rows,
          [TOTAL_ROWS_COUNT_PROPERTY_NAME]: totalCount,
        }));
      }
      return rows;
    });
  }

  // Public API
  findOne(queryName, options) {
    return this._run(queryName, {
      ...options,
      size: 1,
    });
  }

  findAll(queryName, options) {
    return this._run(queryName, options);
  }

  defineSchema(...args) {
    const struct = (size(args) > 1 ? args[1] : args[0]);
    const schemaName = (size(args) > 1 ? args[0] : struct.name);
    return this._defineSchema({
      ...struct,
      name: schemaName,
    });
  }

  defineQuery(...args) {
    const struct = (size(args) > 1 ? args[1] : args[0]);
    const queryName = (size(args) > 1 ? args[0] : struct.name);
    return this._defineQuery({
      ...struct,
      name: queryName,
    });
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
