const assign = require('lodash/assign');
const isArray = require('lodash/isArray');
const size = require('lodash/size');
const Schema = require('../schema/schema');
const schemaList = require('../jar/schema-list');
const debug = require('../debug');

// This class is a copy of the original schemas. Each node inside queries are maped
// to a new exclusive representation of the original schemas. All new specifications
// of use of the schema inside query must be put as method of this class.
class QuerySchema extends Schema {
  constructor(opts = {}) {
    // Pass the "schemaList" reference to parent constructor as it must be saved inside it.
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

  // overrides "getTableHash" parent method. It is necessary cuz associations
  // are made using the original Schema class instances instead of this Query Schema class.
  // The schema used inside resolvers will differ from the original schemas and the
  // hashes used to resolve associations will mismatch. To resolve this issue, the method
  // is overrided and it returns the real schema hash code from the schema in the schema list jar.
  getTableHash() {
    return schemaList.getSchema(this.getSchemaName()).getTableHash();
  }
}

module.exports = QuerySchema;
