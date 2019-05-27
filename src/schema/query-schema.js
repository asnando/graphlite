const assign = require('lodash/assign');
const isArray = require('lodash/isArray');
const size = require('lodash/size');
const Schema = require('../schema/schema');
const schemaList = require('../jar/schema-list');
const debug = require('../debug');

// todo: add class description.
class QuerySchema extends Schema {
  constructor(opts = {}) {
    super(opts, schemaList);
    assign(this, {
      // Object with merged properties definition. If "useProperties" array
      // then it will use only the defined properties inside this array, otherwise
      // will use all the properties from the schema.
      definedProperties: {},
    });
    // "useProperties" refers to a array within properties schema names
    // that must be (only)rendered when the query executes.
    if (opts.useProperties && isArray(opts.useProperties)) {
      this.useProperties = opts.useProperties;
      // As it is an array of string it must be translated to an object
      // within the fields names as key and field definition as value.
      this._createUsePropertiesListFromDefinition(opts.useProperties);
    }
  }

  _createUsePropertiesListFromDefinition(props) {
    props.forEach((propName) => {
      const prop = this.getProperty(propName);
      if (!prop) {
        throw new Error(`Undefined "${propName}" property on "${this.getSchemaName()}" schema.`);
      }
      this.definedProperties[propName] = prop;
    });
  }

  getDefinedProperties() {
    const { definedProperties } = this;
    return size(definedProperties) ? definedProperties : this.getAllProperties();
  }
}

module.exports = QuerySchema;
