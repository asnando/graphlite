const assign = require('lodash/assign');
const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const keys = require('lodash/keys');
const jset = require('lodash/set');
const pbcopy = require('clipboardy');
const schemaList = require('./jar/schema-list');
const queryList = require('./jar/query-list');
const formatQuery = require('./utils/query');
const constants = require('./constants');
const debug = require('./debug');
const jtree = require('./utils/jtree');

const {
  RESPONSE_OBJECT_NAME,
  GRAPHLITE_CONNECTION_EXECUTER_NAME,
} = constants;

const parseResponseRowObject = (row) => {
  const shadow = {};
  const object = JSON.parse(row[RESPONSE_OBJECT_NAME]);
  // Parse each property value of the object.
  jtree(object, (value, path) => {
    // ignore when begin path, value is array or it represents a object inside array.
    if (/^\$$/.test(path) || isArray(value) || /\d$/.test(path)) return;
    let prop = path.match(/\w+\.\w+$/)[0].split('.');
    const [schemaAlias, propName] = prop;
    const schema = schemaList.getSchemaByAlias(schemaAlias);
    prop = schema.getProperty(propName);
    const propValue = prop.parseValue(value);
    const objectPath = path
      .replace(/#(\d{1,})/g, '[$1]')
      .replace(/^\$\.?/, '')
      .replace(/\w+\.(?=\w+$)/, '');
    jset(shadow, objectPath, propValue);
  });
  return shadow;
};

const parseResponseRows = (rows) => {
  const parsedRows = rows.map(row => parseResponseRowObject(row));
  return {
    rows: parsedRows,
    count: parsedRows.length,
  };
};

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
    const resolvedQuery = formatQuery(query.resolve(assign(options, extraOptions)));
    return resolvedQuery;
  }

  _executeQuery(query) {
    const { connection } = this;
    return isFunction(connection)
      ? connection(query)
      : connection[GRAPHLITE_CONNECTION_EXECUTER_NAME](query);
  }

  _run(queryName, options = {}, extraOptions = {}) {
    debug.log(`Fetching data using "${queryName}" query, with options`, options, extraOptions);
    const query = this._mountQuery(queryName, options, extraOptions);
    pbcopy.writeSync(query);
    return this._executeQuery(query).then(parseResponseRows);
  }

  // Public API
  findOne(queryName, options, extraOptions = {}) {
    assign(extraOptions, 'size', 1);
    return this._run(queryName, options, extraOptions);
  }

  findAll(queryName, options, extraOptions = {}) {
    return this._run(queryName, options, extraOptions);
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
