const isArray = require('lodash/isArray');
const jset = require('lodash/set');
const jtree = require('../utils/jtree');
const schemaList = require('../jar/schema-list');
const {
  RESPONSE_OBJECT_NAME,
  ROW_MATCH_OBJECT_KEY_NAME,
} = require('../constants');

// Transform the path string representation to use with the
// lodash "set" function.
const transformPathToLodashSetPath = path => path
  .replace(/#(\d{1,})/g, '[$1]')
  .replace(/^\$\.?/, '')
  .replace(/\w+\.(\w+)$/, '$1');

const replaceAccentsWithAccentsChain = (str = '') => {
  const chain = {
    a: '[AÁÀÂÄÃªaáàâäã]',
    e: '[EÉÈÊËeéèêë]',
    i: '[IÍÌÎÏiíìîï]',
    o: '[OÓÒÔÖÕºoóòôöõ]',
    u: '[UÚÙÛÜuúùûü]',
    c: '[CÇcç]',
  };

  const chainKeys = Object.keys(chain);

  return str
    .split('')
    .map((char) => {
      const chainMatch = chainKeys.find((key) => {
        const list = chain[key];
        return list.indexOf(char) >= 0;
      });
      return chainMatch ? chain[chainMatch] : char;
    })
    .join('');
};

const hightlightTextMatch = (input, output, markup = '<strong>') => {
  input = `(${replaceAccentsWithAccentsChain(input)})`;
  const rgxp = new RegExp(input, 'ig');
  const open = markup;
  const close = markup.replace(/\</, '</');
  return output.replace(rgxp, `${open}$1${close}`);
};

const parseResponseRowObject = (row, { htm }) => {
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
      || /#\d$/.test(path)
    ) return;

    // If ends with the match object property which came from
    // the database response row object. Evaluate always as boolean.
    if (new RegExp(`${ROW_MATCH_OBJECT_KEY_NAME}$`, 'i').test(path)) {
      jset(shadow, transformPathToLodashSetPath(path), !!value);
      return;
    }

    let prop = path.match(/\w+\.\w+$/)[0].split('.');
    const [schemaAlias, propName] = prop;
    // Resolve the property schema.
    const schema = schemaList.getSchemaByAlias(schemaAlias);
    // Get the schema property instance by the property name.
    prop = schema.getProperty(propName);
    // Resolve the property value.
    let propValue = prop.parseValue(value);
    // If property have htm funcionality enabled then it tries
    // to hightlight the matching words from the htm received array.
    if (htm.length && prop.supportHightlightTextMatch()) {
      htm.filter(str => !!str).forEach((str) => {
        propValue = hightlightTextMatch(str, propValue);
      });
    }
    // Set the new parsed value into the shadow of the actual row object.
    jset(shadow, transformPathToLodashSetPath(path), propValue);
  });
  return shadow;
};

module.exports = parseResponseRowObject;
