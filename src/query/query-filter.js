const assign = require('lodash/assign');
const isNil = require('lodash/isNil');
const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const isFunction = require('lodash/isFunction');
const quote = require('../utils/quote');
const debug = require('../debug');
const schemaList = require('../jar/schema-list');
const {
  GRAPHLITE_STRING_DATA_TYPE,
} = require('../constants');

// Examples:
// field = 'abc'
// field = 10
// field like '%abc'
// field like 'abc%'
// field like '%abc%'
// field glob '*abc*'
// field > 1
// field < 1
// field <> 'abc'
// field <> 1

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

const DEFAULT_FILTER_MATCH_TYPE = 'equalsTo';

const equalsTo = str => /^=/.test(str);
const moreThan = str => /^>/.test(str);
const lessThan = str => /^</.test(str);
const beginsWith = str => /^%[\w\.]+$/.test(str);
const endsWith = str => /^[\w\.]+%$/.test(str);
const contains = str => /^%[\w\.]+%$/.test(str);
const globed = str => /^\*/.test(str);
const differs = str => /^<>/.test(str);

const resolveMatchType = (str) => {
  if (equalsTo(str)) return 'equalsTo';
  if (moreThan(str)) return 'moreThan';
  if (lessThan(str)) return 'lessThan';
  if (contains(str)) return 'contains';
  if (endsWith(str)) return 'endsWith';
  if (beginsWith(str)) return 'beginsWith';
  if (globed(str)) return 'globed';
  if (differs(str)) return 'differs';
  return DEFAULT_FILTER_MATCH_TYPE;
};

const detectPropertyFromString = (str) => {
  const rgxp = /^(=|%|<>|<|>)/;
  return str.replace(rgxp, '');
};

const isQueryLike = str => !/^(=|%|<>|<|>)?[\w\.]+$/.test(str);

const getSchema = schemaName => schemaList.getSchema(schemaName);

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
    // = Equals, % Like, <> Different, < Less than, > More than
    operator = defaultProps.operator,
    // || or, && and
    join = defaultProps.join,
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
    } else if (!isNil(property)) {
      this.property = property;
      this.matchType = resolveMatchType(operator);
    } else if (!isNil(properties)) {
      this.properties = properties;
      this.matchType = resolveMatchType(operator);
    }

    assign(this, {
      name,
      htm,
      join,
      parser: resolveParser(parser),
      schemaName,
      static: /^static$/.test(name),
    });

    console.log(name, '-', this.resolve('AAA'));
  }

  resolve(value) {
    const {
      condition,
      property,
      properties,
      matchType,
      join,
      static: isStatic,
      schemaName,
      // schema,
    } = this;
    const schema = getSchema(schemaName);
    if (!isNil(condition)) {
      if (isStatic) {
        return resolveStaticCondition(condition, schema);
      } else {
        debug.warn('must resolve condition #2', condition);
      }
    } else if (!isNil(property)) {
      return resolvePropWithOperator(property, value, matchType, schema);
    } else if (!isNil(properties)) {
      return resolvePropList(properties, value, matchType, join, schema);
    }
    return '';
  }
}

const getPropertyFromSchema = (schema, propName) => schema.getProperty(propName);
const containsPropMarkup = str => /\$\{[\w\.]+\}/.test(str);
const getPropMarkupsFromString = str => Array.from(str.match(/(\$\{[\w\.]+\})/g));
const removePropMarkup = markup => markup.replace(/^\$\{/, '').replace(/\}$/, '');

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
        return quote(`${value}%`);
      case 'beginsWith':
        return quote(`%${value}`);
      case 'globed':
        return quote(`*${value}*`);
      case 'equalsTo':
      default:
        return quote(value);
    }
  }
  return value;
};

const propRefersToAnotherSchema = propName => /\w+\.\w+/.test(propName);

const resolvePropWithOperator = (propName, value, matchType, schema) => {
  let prop = getPropertyFromSchema(schema, propName);
  if (propRefersToAnotherSchema(propName)) {
    let useSchema = propName.split('.').shift();
    // eslint-disable-next-line no-param-reassign
    propName = propName.split('.').pop();
    useSchema = getSchema(useSchema);
    prop = useSchema.getProperty(propName);
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
      return `${name} ${value}`;
    case 'differs':
      return `${name}<>${value}`;
    case 'equalsTo':
    default:
      return `${name}=${value}`;
  }
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

const resolvePropList = (props, value, matchType, join, schema) => props
  .map(prop => resolvePropWithOperator(prop, value, matchType, schema))
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

module.exports = QueryFilter;
