const _ = require('./utils');
const debug = require('./debugger');

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
          ? path.concat('.').concat(node.name) : path
          : '$';

      // When data from node is in array format, will try
      // parse this node data removing the null rows.
      if (objectType === 'array') {
        shadow[path] = resolver.bind(this, [stripNulls]);
      }
  
      node.definedProperties.filter(prop => {
        return prop.type === 'primaryKey' ? !parentAssociation : true;
      }).map(prop => {
        const resolvers = [];
        const propName = prop.type === 'primaryKey' ? '_id' : prop.name;

        switch (prop.type) {
          case 'boolean':
            resolvers.push(toBoolean);
            break;
          case 'number':
            resolvers.push(toNumber);
            break;
        };

        if (_.isFunction(prop.parser)) {
          resolvers.push(prop.parser);
        }

        const propPath = path.concat('.').concat(propName);

        return resolvers.length ? {
          [propPath]: resolver.bind(this, resolvers)
        } : {};
      }).forEach(prop => {
        shadow = _.xtend(shadow, prop);
      });

    });
    return shadow;
  }

  parse(rows) {
    return (!rows || !rows.length) ? [] : rows.map(row => {
      // Call resolvers
      _.keys(this.shadow).forEach(path => {
        const resolver = this.shadow[path];
        path = path.replace(/^\$\./, '');
        const resolvedValue = resolver(_.get(row, path));
        _.set(row, path, resolvedValue);
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

function toBoolean(value) {
  return !!value;
}

function stripNulls(value) {
  return value.filter(val => val);
}