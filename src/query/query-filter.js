const assign = require('lodash/assign');
const isNil = require('lodash/isNil');
const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const isFunction = require('lodash/isFunction');
const quote = require('../utils/quote');
const withParenthesis = require('../utils/withParenthesis');
const replaceWithCharactersChain = require('../utils/replace-with-characters-chain');
const debug = require('../debug');
const schemaList = require('../jar/schema-list');
const {
  GRAPHLITE_STRING_DATA_TYPE,
} = require('../constants');

const DEFAULT_FILTER_MATCH_TYPE = 'equalsTo';

// Todo: resolve parser
const resolveParserFromList = (name) => {
  switch (name) {
    default:
      return null;
  }
};

const resolveParser = (parser) => {
  if (isString(parser)) {
    return resolveParserFromList(parser);
  }
  if (isFunction(parser)) {
    return parser;
  }
  return null;
};

// =propName, =
const equalsTo = str => /^=[\w\.]{0,}$/.test(str);
// >propName, >
const moreThan = str => /^>[\w\.]{0,}$/.test(str);
// <propName, <
const lessThan = str => /^<[\w\.]{0,}$/.test(str);
// %propName, ^%
const beginsWith = str => /^(%[\w\.]+)$|^\^%$/.test(str);
// propName%, ...%
const endsWith = str => /^([\w\.]+|\.{3})%$/.test(str);
// %propName%, %%
const contains = str => /^%[\w\.]+%$|^%{2}$/.test(str);
// *propName, *
const globed = str => /^\*[\w\.]{0,}$/.test(str);
// <>propName, <>
const differs = str => /^<>[\w\.]{0,}$/.test(str);

const resolveMatchType = (str) => {
  if (equalsTo(str)) return 'equalsTo';
  if (moreThan(str)) return 'moreThan';
  if (lessThan(str)) return 'lessThan';
  if (beginsWith(str)) return 'beginsWith';
  if (endsWith(str)) return 'endsWith';
  if (contains(str)) return 'contains';
  if (globed(str)) return 'globed';
  if (differs(str)) return 'differs';
  return DEFAULT_FILTER_MATCH_TYPE;
};

const detectPropertyFromString = str => str
  // Begins with
  .replace(/^(=|%|<>|<|>|\*|\^%|\.{3}%)/, '')
  // Ends with
  .replace(/%$/, '');

const isQueryLike = str => (
  !(equalsTo(str)
    || moreThan(str)
    || lessThan(str)
    || contains(str)
    || endsWith(str)
    || beginsWith(str)
    || globed(str)
    || differs(str))
);

const getPropertyFromSchema = (schema, propName) => schema.getProperty(propName);
const containsPropMarkup = str => /\$\{[\w\.]+\}/.test(str);
const getPropMarkupsFromString = str => Array.from(str.match(/(\$\{[\w\.]+\})/g));
const removePropMarkup = markup => markup.replace(/^\$\{/, '').replace(/\}$/, '');
const propRefersToAnotherSchema = propName => /\w+\.\w+/.test(propName);

const extractSchemaNameFromPropName = (propName) => {
  if (propRefersToAnotherSchema(propName)) {
    return propName.match(/(\w+)\.\w+/)[1];
  }
  return null;
};

const resolvePropJoinType = (type) => {
  switch (type) {
    case '||':
      return ' OR ';
    case '&&':
    default:
      return ' AND ';
  }
};

// Quote the query value based on value and match type.
const resolveFilterValue = (value, matchType) => {
  const shouldQuoteValue = typeof value === GRAPHLITE_STRING_DATA_TYPE;
  if (shouldQuoteValue) {
    // Prevent query from breaking if user input any (') on filter value.
    // eslint-disable-next-line no-param-reassign
    value = value.replace(/'/g, '\'\'');
    switch (matchType) {
      case 'contains':
        return quote(`%${value}%`);
      case 'endsWith':
        return quote(`%${value}`);
      case 'beginsWith':
        return quote(`${value}%`);
      case 'globed':
        return quote(`*${replaceWithCharactersChain(value)}*`);
      case 'equalsTo':
      default:
        return quote(value);
    }
  }
  return value;
};

const resolvePropWithOperator = (propName, value, matchType, schema) => {
  let prop = getPropertyFromSchema(schema, propName);
  if (propRefersToAnotherSchema(propName)) {
    let useSchema = propName.split('.').shift();
    // eslint-disable-next-line no-param-reassign
    propName = propName.split('.').pop();
    useSchema = schemaList.getSchema(useSchema);
    prop = useSchema.translateToProperty(propName);
  }
  const propColumnName = prop.getPropertyColumnName();
  const propTableAlias = prop.getPropertyTableAlias();
  const name = `${propTableAlias}.${propColumnName}`;
  // eslint-disable-next-line no-param-reassign
  value = resolveFilterValue(value, matchType);
  switch (matchType) {
    case 'moreThan':
      return `${name}>${value}`;
    case 'lessThan':
      return `${name}<${value}`;
    case 'contains':
      return `${name} LIKE ${value}`;
    case 'endsWith':
      return `${name} LIKE ${value}`;
    case 'beginsWith':
      return `${name} LIKE ${value}`;
    case 'globed':
      return `${name} GLOB ${value}`;
    case 'differs':
      return `${name}<>${value}`;
    case 'equalsTo':
    default:
      return `${name}=${value}`;
  }
};

// If value is string and contains spaces, then resolve the condition
// with the value N times with each word from string.
const resolvePropWithValue = (propName, value, matchType, join, schema) => {
  if (isString(value) && /\s/.test(value)) {
    return value
      .split(' ')
      .map(chunk => resolvePropWithOperator(propName, chunk, matchType, schema))
      .join(resolvePropJoinType(join));
  }
  return resolvePropWithOperator(propName, value, matchType, schema);
};

const resolvePropList = (props, value, matchType, join, schema) => props
  .map(prop => resolvePropWithValue(prop, value, matchType, join, schema))
  .join(resolvePropJoinType(join));

const translatePropsMarkups = (condition, schema) => {
  const props = getPropMarkupsFromString(condition);
  props.forEach((propMarkup) => {
    const propName = removePropMarkup(propMarkup);
    const prop = getPropertyFromSchema(schema, propName);
    const propColumnName = prop.getPropertyColumnName();
    const propTableAlias = prop.getPropertyTableAlias();
    // eslint-disable-next-line no-param-reassign
    condition = condition.replace(propMarkup, `${propTableAlias}.${propColumnName}`);
  });
  return condition;
};

const resolveStaticCondition = (conditions, schema) => {
  // eslint-disable-next-line no-param-reassign
  conditions = isArray(conditions) ? conditions : [conditions];
  return conditions.map((condition) => {
    if (containsPropMarkup(condition)) {
      // eslint-disable-next-line no-param-reassign
      condition = translatePropsMarkups(condition, schema);
    }
    return condition;
  }).join(' AND ');
};

const resolveCondition = (condition, schema, value) => {
  debug.warn('Todo: resolveCondition -', condition);
  return '';
};

const defaultProps = {
  htm: false,
  operator: '=',
  join: '&&',
};

class QueryFilter {
  constructor({
    name,
    schemaName,
    property,
    properties,
    // String/Function
    parser,
    // Filter defined in compact string format instead of object.
    condition,
    htm = defaultProps.htm,
    operator = defaultProps.operator,
    join = defaultProps.join,
    behavior = 'restrict',
  }) {
    if (!isNil(condition)) {
      if (isArray(condition)) {
        // If just one condition inside array tries to use it as string.
        if (condition.length === 1) {
          // eslint-disable-next-line no-param-reassign, prefer-destructuring
          condition = condition[0];
        } else {
          this.condition = condition;
        }
      }
      if (isString(condition)) {
        // If condition just refers to property name then uses
        // as property key instead of condition.
        if (!isQueryLike(condition)) {
          this.property = detectPropertyFromString(condition);
          this.matchType = resolveMatchType(condition);
        } else {
          this.condition = condition;
        }
      }
    } else if (!isNil(properties)) {
      this.properties = properties;
      this.matchType = resolveMatchType(operator);
    } else if (!isNil(property)) {
      this.property = property;
      this.matchType = resolveMatchType(operator);
    }

    assign(this, {
      name,
      htm,
      join,
      parser: resolveParser(parser),
      schemaName,
      static: /^static$/.test(name),
      behavior,
    });
  }

  getFilterName() {
    const { name } = this;
    return name;
  }

  supportHTM() {
    const { htm } = this;
    return htm;
  }

  resolve(input) {
    const {
      condition,
      property,
      properties,
      matchType,
      join,
      static: isStatic,
      schemaName,
      parser,
    } = this;
    const schema = schemaList.getSchema(schemaName);
    // Use the parser function when defined.
    const value = isFunction(parser) ? parser(input) : input;
    let resolvedValue = '';
    if (!isNil(condition)) {
      if (isStatic) {
        resolvedValue = resolveStaticCondition(condition, schema);
      } else {
        resolvedValue = resolveCondition(condition, schema, value);
      }
    } else if (!isNil(property)) {
      resolvedValue = resolvePropWithValue(property, value, matchType, join, schema);
    } else if (!isNil(properties)) {
      resolvedValue = resolvePropList(properties, value, matchType, join, schema);
    }
    return withParenthesis(resolvedValue);
  }

  usesAnotherSchema() {
    const { condition, property, properties } = this;
    if (!isNil(condition)) {
      if (!isQueryLike(condition)) {
        return propRefersToAnotherSchema(condition);
      }
    } else if (!isNil(properties)) {
      return !!properties.find(prop => propRefersToAnotherSchema(prop));
    } else if (!isNil(property)) {
      return propRefersToAnotherSchema(property);
    }
    return false;
  }

  getSchemaNames() {
    const {
      condition,
      property,
      properties,
      schemaName,
    } = this;
    if (!isNil(condition)) {
      if (!isQueryLike(condition)) {
        return extractSchemaNameFromPropName(condition) || schemaName;
      }
    } else if (!isNil(properties)) {
      return properties
        .map(prop => extractSchemaNameFromPropName(prop))
        .map(schema => schema || schemaName);
    } else if (!isNil(property)) {
      return extractSchemaNameFromPropName(property) || schemaName;
    }
    return schemaName;
  }

  // Return boolean if nested array records must be fetched even when
  // not matching the inputed filter value. For example: If you have a sub list
  // and want to always bring the top 10 items(ordered in the top) even if they
  // don't match the inputed filter value.
  // The default behavior for when using a filter it to not preserve another
  // collection records.
  shouldPreserve(usePreservation = false) {
    const { behavior } = this;
    if (!usePreservation) {
      return false;
    }
    if (/restrict/.test(behavior)) {
      return false;
    }
    if (/preserve/.test(behavior)) {
      return true;
    }
    return false;
  }
}

module.exports = QueryFilter;
