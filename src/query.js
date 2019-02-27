const debug = require('./utils/debug');
const warn = require('./utils/warn');
const alert = require('./utils/alert');
const  _ = require('./utils/');
const Graph = require('./graph');

// TODO: Create query nodes resolvers.

class Query {

  constructor(opts) {
    this.name = opts.name;
    this.rawGraph = opts.graph;
    this.schemaProvider = opts.schemaProvider;
    this.graph = this._resolveGraph(this.rawGraph);
  }

  _resolveGraph(graph) {
    let resolvedGraph = new Graph();

    _.jtree(graph, (node, path) => {
      const isSchemaNode = !/^\$$/.test(path) && !/(?<=\.where)|(properties|\d|where|type|(?<=has)(\w+)|(?<=\_)\w+)$/.test(path);
      if (!isSchemaNode) return;
      const schemaName = path.split('.').pop();
      // Resolves the schema graph
      if (_.isFunction(this.schemaProvider)) {
        
        const schema = this.schemaProvider(schemaName);
        if (!schema) throw new Error(`Coult not detect schema configuration for "${schemaName}".`);
        
        const resolvedProperties = _.equals(node.properties, '*') ? schema.properties
          : schema.properties.filter(schemaProp => node.properties.includes(schemaProp.name));

        resolvedGraph.addNode(schema.hash, {
          properties: resolvedProperties,
          tableName: schema.tableName,
          hash: schema.hash,
          type: _.defaults(node.type, 'object'),
          options: {
            where: node.where,
            orderBy: node.orderBy,
            size: node.size,
            page: node.page
          },
          resolveProperties: schema._resolveProperties,
          resolve: this._resolveQueryNode
        });

      }
    });
    return resolvedGraph;
  }

  _resolveQueryNode() {
    debug('Resolve Query Node:', this);
    return this.resolveProperties();
  }

  build(options = {}) {
    alert(`Building query "${this.name}" with options ${_.jpretty(options)}`);
    // this.graph.walk(node => {
      const node = this.graph.getNode(this.graph.getRootNodeHash());
      let query;
      const parent = node.parent();
      const fields = node.resolveProperties();
      const schemaType = node.type;
      const schemaName = node.tableName;

      switch (schemaType) {
        case 'object':
          query = `SELECT json_object(${fields}) FROM ${schemaName}`;
          break;
        case 'array':
          query = `SELECT json_group_array(json_object(${fields})) FROM ${schemaName}`;
          break;
      };

      debug(node.resolveNextNodes());

      // if (!!parent) {
      //   const parentSchemaName = parent.tableName;
      //   query += ``;
      // }

      debug('***');
      debug(query);
    // });
  }

}

module.exports = Query;