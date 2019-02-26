const debug = require('./utils/debug');
const warn = require('./utils/warn');
const  _ = require('./utils/');

class Query {

  constructor(opts) {
    _.xtend(this, {
      name: opts.name,
      graph: opts.graph,
      resolvedGraph: this._resolveGraph(opts.graph, opts.schemaProvider)
    });
  }

  _resolveGraph(graph, schemaProvider) {
    // Schema provider is a function that will receive the schema name and must
    // return it configurations. This function will be provided by the class which
    // created the instance of this object (it will be received inside constructor options object).

    function isGraphNode(path) {
      return !/^\$$/.test(path) && !/(\.properties)|(\#\d+)|(\.where)|(\.where\.\w+)$/.test(path);
    }

    let resolvedGraph = {
      _nodeHashes: {},
      _rootNode: null,
      _lastNode: null
    };

    _.jtree(graph, (node, path) => {

      if (!isGraphNode(path) || !_.isFunction(schemaProvider)) return;

      const schemaName = path.split('.').pop();
      const schema = schemaProvider(schemaName);

      const resolvedProperties = node.properties === '*'
        ? schema.properties
        : schema.properties.filter(prop => node.properties.includes(prop.name));

      // Sets the root node if not defined yet.
      if (!resolvedGraph._rootNode) {
        resolvedGraph._rootNode = schema._getHashCode();
      }

      const parentNodeName = path.match(/\./g).length >= 2
        ? path.match(/(\w+)\.\w+$/)[1] : null;

      const parentNodeHash = parentNodeName
        ? resolvedGraph._nodeHashes[parentNodeName] : null;

      // If parent node then add this node to the parent nextNodes list.
      if (parentNodeHash) {
        resolvedGraph[parentNodeHash]._nextNodes.push(schema._getHashCode());
      }

      // Adds the hash code of the node inside the hash nodes list of main graph.
      resolvedGraph._nodeHashes[schema.name] = schema._getHashCode();

      resolvedGraph[schema._getHashCode()] = {
        name: schema.name,
        tableName: schema.tableName,
        idPropertyName: schema.idPropertyName,
        properties: resolvedProperties,
        options: {
          where: node.where,
          orderBy: node.orderBy,
          size: node.size,
          page: node.page
        },
        resolveOptions: function(args) {
          // When query is executed it will receive a list of values for
          // each option in this node. This function will resolve within the names
          // from options object and the options object (above) of this class.
          return {};
        },
        _hash: schema._getHashCode(),
        _nextNodes: [],
        _prevNode: parentNodeHash || null
      };

      // Updates the last walked node in the graph
      resolvedGraph._lastNode = schema._getHashCode();
    });

    // debug('Resolved graph:', resolvedGraph);
    return resolvedGraph;
  }

  build(opts = {}) {
    debug('Building with options:', opts);
    const filterQuery = this._resolveFilterQuery(opts);
    let resolvedQuery = this._resolveQuery(opts);
    resolvedQuery = resolvedQuery.replace(/$/, ` WHERE PRODUTO.CodigoProduto IN (${filterQuery})`);
    debug(resolvedQuery);
    _.pbcopy(resolvedQuery);
    return null;
  }

  _resolveQuery(opts) {
    const graph = this.resolvedGraph;

    function parseNode(nodeHash) {
      let query;
      const node = graph[nodeHash];
      const parentNode = node._prevNode ? grap[node._prevNode] : null;

      const fields = node.properties.map(prop => {
        const value = (() => {
          if (prop.join) {
            return `|| ${prop.join.join('')} || `;
          } else if (prop.resolve) {
            return `CASE ${prop.resolve.map(v => `WHEN ${v} IS NOT NULL AND ${v}<>'' THEN ${v}`).join(' ')} ELSE NULL END`;
          } else {
            return node.tableName.concat('.').concat(prop.alias || prop.name);
          }
        })();
        return { name: prop.name, value };
      }).map(field => {
        return [ _.quote(field.name), field.value ].join(',');
      });

      if (parentNode) {
        query = ``;
      } else {
        query = `SELECT json_object(${fields}) FROM ${node.tableName}`;
      }

      // if (!parentNode) {
      //   query += ';';
      // }

      return query;
    }

    return parseNode(graph._rootNode);
  }

  _resolveFilterQuery(opts) {
    const graph = this.resolvedGraph;

    let options = {
      where: [],
      orderBy: [],
      size: 30,
      page: 1
    };

    function mixOptions(o1, o2) {
      _.keys(o2).forEach((keyName, index, self) => {
        switch (keyName) {
          case 'where':
            o1.where = o1.where.concat(self.where);
            break;
          case 'orderBy':
            o1.orderBy.push(self.orderBy);
            break;
          case 'page':
            break;
          case 'size':
            break;
        };
      });
      return o1;
    }

    function parseNode(nodeHash) {
      let query;
      const node = graph[nodeHash];
      const parentNode = node._prevNode ? graph[node._prevNode] : null;

      options = mixOptions(options, node.resolveOptions(opts));

      if (parentNode) {
        const crossTableName = `${parentNode.tableName}_${node.tableName}`;
        query = `
          INNER JOIN ${crossTableName} ON ${crossTableName}.${parentNode.idPropertyName}=${parentNode.tableName}.${parentNode.idPropertyName}
          INNER JOIN ${node.tableName} ON ${node.tableName}.${node.idPropertyName}=${crossTableName}.${node.idPropertyName}
        `;
      } else {
        query = `SELECT DISTINCT ${node.tableName}.${node.idPropertyName} FROM ${node.tableName}`
      }

      if (node._nextNodes.length) {
        for (let index = 0; index < node._nextNodes.length; index++)
          query += ' '.concat(parseNode(node._nextNodes[index]));
      }
      
      if (!parentNode) {
        if (options.where.length) {
          query += ` WHERE ${options.where.join(' AND ')}`;
        }
        if (options.orderBy.length) {
          query += `ORDER BY ${options.orderBy.join(',')}`;
        }
        query += `LIMIT ${options.size} OFFSET ${options.size * (options.page - 1)}`;
        // query += ';';
      }
      
      return query;
    }

    const query = parseNode(graph._rootNode);
    return query;
  }

}

module.exports = Query;