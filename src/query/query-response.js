const _ = require('../utils');
const debug = require('../debugger');
const {
  PRIMARY_KEY_DATA_TYPE,
  NUMERIC_DATA_TYPE,
  STRING_DATA_TYPE,
  BOOLEAN_DATA_TYPE,
  INTEGER_DATA_TYPE,
  FLOAT_DATA_TYPE,
} = require('../constants');

class QueryResponse {

  constructor(graph) {
    this.shadow = this.createShadowFromGraph(graph);
  }

  createShadowFromGraph(graph) {
    let shadow = {},
        path;

    graph.walk(node => {
      const parentAssociation = node.parentAssociation;
      const objectType = parentAssociation ? parentAssociation.objectType : 'object';

      path = path ? objectType === 'array'
          ? path.concat('.').concat(node.name) : path : '$';

      // When data from node is in array format, will try
      // parse this node data removing the null rows.
      if (objectType === 'array') {
        shadow[path] = resolver.bind(this, [stripNulls]);
      }
  
      node.definedProperties.filter(prop => {
        return prop.type === PRIMARY_KEY_DATA_TYPE ? !parentAssociation : true;
      }).map(prop => {
        const resolvers = [];
        const propName = prop.type === PRIMARY_KEY_DATA_TYPE ? '_id' : prop.name;

        switch (prop.type) {
          case BOOLEAN_DATA_TYPE:
            resolvers.push(toBoolean);
            break;
          case FLOAT_DATA_TYPE:
            resolvers.push(toFloat);
            break;
          case INTEGER_DATA_TYPE:
            resolvers.push(toInt);
            break;
          case NUMERIC_DATA_TYPE:
            resolvers.push(toNumber);
            break;
        };

        if (_.isFunction(prop.parser)) {
          resolvers.push(prop.parser);
        }

        const propPath = path.concat('.').concat(propName);

        return !resolvers.length ? {} : {
          [propPath]: resolver.bind(this, resolvers)
        };
      }).forEach(prop => {
        shadow = _.xtend(shadow, prop);
      });

    });
    return shadow;
  }

  parse(rows) {
    const shadow = this.shadow;
    return rows.map(row => {
      _.keys(shadow).forEach(shadowPath => {
        const rawShadowPath = shadowPath.replace(/^\$\./, '');
        const rowShadowPathValue = _.get(row, rawShadowPath);
        if (_.isDef(rowShadowPathValue)) {
          _.set(row, rawShadowPath, shadow[shadowPath](rowShadowPathValue));
        }
      });
      return row;
    });
  }

}

module.exports = QueryResponse;

const resolver = function(resolvers, value) {
  if (!resolvers || !resolvers.length) {
    return value;
  }
  resolvers.forEach(resolver => value = resolver(value));
  return value;
}

function toNumber(value) {
  return parseInt(value);
}

function toInt(value) {
  return parseInt(value);
}

function toFloat(value) {
  return parseFloat(value);
}

function toBoolean(value) {
  return !!value;
}

function stripNulls(value) {
  return _.isArray(value) ? value.filter(v => v) : value;
}