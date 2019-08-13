const assign = require('lodash/assign');
const size = require('lodash/size');
const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const isString = require('lodash/isString');
const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const Schema = require('./schema');
const constants = require('../constants');
const QueryFilter = require('../query/query-filter');

const {
  DEFAULT_PAGE_SIZE,
} = constants;

// This class is a copy of the original schemas. Each node inside queries are maped
// to a new exclusive representation of the original schemas. All new specifications
// of use of the schema inside query must be put as method of this class.
class QuerySchema extends Schema {
  constructor(opts = {
    schema: {},
    options: {
      where: {},
      page: 1,
      size: DEFAULT_PAGE_SIZE,
      orderBy: [],
      groupBy: [],
    },
    displayAs: null,
    useProperties: [],
    ignoreId: false,
    // htm contains a list of filter names or static strings that will
    // be used by the Hightlight text match functionality. When any of the
    // filters from the array is used, the inputed value for the filter will
    // be searched and highlighted inside all the schema properties with
    // the htm enabled.
    htm: [],
  }) {
    super(opts.schema);
    // Extend specific QuerySchema Class props.
    assign(this, {
      // Object with merged properties definition. If "useProperties" array
      // then it will use only the defined properties inside this array, otherwise
      // will use all the properties from the schema.
      definedProperties: {},
      definedOptions: opts.options,
      displayAs: opts.displayAs,
      htm: opts.htm,
    });
    // it must return a list of all schema properties merged with usedProperties
    // names array(when defined). It must check too when id needs to be used or not.
    const useProperties = this.resolveSchemaPropertiesNamesList(opts.ignoreId, opts.useProperties);
    // As it is an array of string it must be translated to an object
    // within the fields names as key and field definition as value.
    this._createUsePropertiesListFromDefinition(useProperties);
    // #
    this.filters = this._transformOptionsFiltersToQueryFilters();
  }

  // Todo: Add description
  _transformOptionsFiltersToQueryFilters() {
    const filters = {};
    const { definedOptions } = this;
    const { where } = definedOptions;
    keys(where).forEach((name) => {
      const filter = where[name];
      filters[name] = (() => {
        // Pass down reference to this, so the QueryFilter
        // can detect this schema needed definitions.
        const schemaName = this.getSchemaName();
        if (isString(filter) || isArray(filter)) {
          return new QueryFilter({
            condition: filter,
            name,
            schemaName,
          });
        }
        if (isObject(filter)) {
          return new QueryFilter({
            ...filter,
            name,
            schemaName,
            condition: undefined,
          });
        }
        return null;
      })();
    });
    return filters;
  }

  getFilterList() {
    const { filters } = this;
    return filters;
  }

  _createUsePropertiesListFromDefinition(props) {
    props.forEach((propName) => {
      this.definedProperties[propName] = this.translateToProperty(propName);
    });
  }

  getDefinedProperties() {
    const { definedProperties } = this;
    return size(definedProperties) ? definedProperties : this.getAllProperties();
  }

  getDefinedOptions() {
    return this.definedOptions;
  }

  // Return the list of pre defined filters names that the inputed
  // strings must be used for text match hightlighting.
  getFiltersWithHTMSupport() {
    const { filters } = this;
    return keys(filters)
      .map(filterName => filters[filterName])
      .filter(filter => filter.supportHTM())
      .map(filter => filter.getFilterName());
  }

  getDisplayName() {
    return this.displayAs || this.getSchemaName();
  }

  // This method is acessed by the child node resolver
  // to check if its parent have any group by options defined.
  // This verification is necessary to let SQLite know if it neeeds to
  // use the ids already grouped from the parent node instead of a new join.
  haveGroupByOptions() {
    const definedOptions = this.getDefinedOptions();
    return !isNil(definedOptions.groupBy);
  }
}

module.exports = QuerySchema;
