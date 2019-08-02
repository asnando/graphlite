const isArray = require('lodash/isArray');
const jset = require('lodash/set');
const jtree = require('../utils/jtree');
const schemaList = require('../jar/schema-list');
const {
  RESPONSE_OBJECT_NAME,
} = require('../constants');

const parseResponseRowObject = (row) => {
  const shadow = {};
  const object = JSON.parse(row[RESPONSE_OBJECT_NAME]);
  // Parse each property value/index of the object.
  jtree(object, (value, path) => {
    // Ignore path when:
    if (
      // refers to beggining path "$"
      /^\$$/.test(path)
      // value is array (it will be maped from another function)
      || isArray(value)
      // path refers to a array index
      || /\.\d$/.test(path)
    ) return;

    let prop = path.match(/\w+\.\w+$/)[0].split('.');
    const [schemaAlias, propName] = prop;
    // Resolve the property schema.
    const schema = schemaList.getSchemaByAlias(schemaAlias);
    // Get the schema property instance by the property name.
    prop = schema.getProperty(propName);
    // Resolve the property value.
    const propValue = prop.parseValue(value);
    // Transform the path string representation to use with the
    // lodash "set" function.
    const objectPath = path
      .replace(/#(\d{1,})/g, '[$1]')
      .replace(/^\$\.?/, '')
      .replace(/\w+\.(\w+)$/, '$1');
    // Set the new parsed value into the shadow of the actual row object.
    jset(shadow, objectPath, propValue);
  });
  return shadow;
};

module.exports = parseResponseRowObject;
