const assign = require('lodash/assign');
const size = require('lodash/size');
const keys = require('lodash/keys');
const Schema = require('../schema/schema');
const schemaList = require('../jar/schema-list');
const constants = require('../constants');
const debug = require('../debug');

const {
  DEFAULT_PAGE_SIZE,
} = constants;

// This class is a copy of the original schemas. Each node inside queries are maped
// to a new exclusive representation of the original schemas. All new specifications
// of use of the schema inside query must be put as method of this class.
class QuerySchema extends Schema {
  constructor(opts = {
    options: {
      where: {},
      page: 1,
      size: DEFAULT_PAGE_SIZE,
      orderBy: [],
      groupBy: [],
    },
    useProperties: [],
    ignoreId: false,
  }) {
    // Pass the "schemaList" reference to parent constructor as it must be saved inside it.
    super(opts, schemaList);
    assign(this, {
      // Object with merged properties definition. If "useProperties" array
      // then it will use only the defined properties inside this array, otherwise
      // will use all the properties from the schema.
      definedProperties: {},
      options: opts.options,
    });
    // it must return a list of all schema properties merged with usedProperties
    // names array(when defined). It must check too when id needs to be used or not.
    const useProperties = this.resolveSchemaPropertiesNamesList(opts.ignoreId, opts.useProperties);
    // As it is an array of string it must be translated to an object
    // within the fields names as key and field definition as value.
    this._createUsePropertiesListFromDefinition(useProperties);
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

  // check if defined query filters have some input value.
  hasAssociatedOption(queryOptions = {}) {
    const { where } = this.options;
    if (!size(keys(where))) {
      return false;
    }
    return !!keys(where).find(key => !!queryOptions[key]);
  }
}

module.exports = QuerySchema;
