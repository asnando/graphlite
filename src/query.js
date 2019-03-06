const debug = require('./debugger');
const  _ = require('./utils/');
const Graph = require('./graph');

class Query {

  constructor(name, graph, schemaProvider) {
    this.name = name;
    this.rawGraph = graph;
    this.schemaProvider = schemaProvider;
    this.graph = this._resolveGraph(this.rawGraph);
  }

  _resolveGraph(graph) {
    let resolvedGraph = new Graph();
    const schemaProvider = this.schemaProvider;

    _.jtree(graph, (node, path) => {
      const isSchemaNode = !/^\$$/.test(path) && !/(?<=\.where)|(?<=\.properties)|(properties|\d|where|type|(?<=has)(\w+)|(?<=\_)\w+)$/.test(path);

      if (!isSchemaNode) return;

      const schemaName = path.split('.').pop();

      // Resolves the schema graph
      const schema = schemaProvider(schemaName);
      
      if (!schema) {
        throw new Error(`Could not detect schema configuration for "${schemaName}".`);
      }

      function getParentName() {
        return resolvedGraph.getTailNode().raw().name;
      }

      function hasParentRelation(schema, node) {
        // TODO: Two way check (has and belongs).
        // Node will receive the schema node representation which will
        // have the "getParent" method to work with.
        const parent = node ? node.getParent() : resolvedGraph.getTailNode();
        // No parent found for this schema.
        if (!parent || !_.isFunction(parent.raw)) return false;
        const parentRaw = parent.raw();
        const hasRelationWith = _.keys(parentRaw.has.many).concat(_.keys(parentRaw.has.one));
        return hasRelationWith.includes(schema.name) ? true : hasParentRelation(schema, parent);
      }

      let relationSize;
      
      // Check if this schema have relation with the parent schema.
      if (!!resolvedGraph.tail && !hasParentRelation(schema)) {
        const errorMessage = `"${schema.name}" has no relation with "${getParentName()}"`;
        debug.error(errorMessage);
        throw(errorMessage);
      }

      return resolvedGraph.addNode(schema.hash, {
        ...schema,
        options: {
          where: node.where,
          orderBy: node.orderBy,
          size: node.size,
          page: node.page
        },
        relationSize,
        // 
        resolveTableName: schema._resolveTableName,
        resolveSource: function() {

        },
        resolveProperties: schema._resolveProperties,
        resolveOptions: function() {
          return '';
        }
      }, graphNodeResolver);

    });
    return resolvedGraph;
  }

  build(options = {}) {
    debug.alert(`Building query "${this.name}" with options ${_.jpretty(options)}`);
    this.graph.resolve();
  }

}

function graphNodeResolver(rawNode, node, nextNodes) {
  // debug.debug(rawNode, node, nextNodes);
}

module.exports = Query;