const debug = require('../debugger');
const  _ = require('../utils/');
const Graph = require('../graph/graph');
const QueryNode = require('./query-node');
const QueryResponse = require('./query-response');

const SQLitegraphNodeResolver            = require('./resolvers/sqlite/main');
const SQLitegraphNodeOptionsResolver     = require('./resolvers/sqlite/options');
const SQLitegraphNodeGroupIdsResolver    = require('./resolvers/sqlite/groupId');
const SQLitegraphRootNodeOptionsResolver = require('./resolvers/sqlite/filterId');
const SQLitegraphCountResolver           = require('./resolvers/sqlite/count');

class Query {

  // Query is basically a graph which nodes represents
  // each schema declared or associated in the query definition graph.
  constructor(name, graph, schemaProvider) {
    // Queries will be builded and resolved by their names.
    this.name = name;
    // Save raw graph definition if it needs to be used later.
    this.rawGraph = graph;
    // The "schemaProvider" is a function received from this main lib class
    // which returns the schema instance using its name. All schemas
    // are accessible in the main lib instance.
    this.schemaProvider = schemaProvider;
    // This will be the resolved graph which will resolve the query.
    this.graph = this._resolveGraph(this.rawGraph);
    this.rowsParser = new QueryResponse(this.graph);
  }

  _resolveGraph(graph) {

    let resolvedGraph = new Graph();
    const schemaProvider = this.schemaProvider;

    // In order to create the query graph we need to
    // check which paths represents a schema and which do not.
    _.jtree(graph, (node, path, options) => {

      // Check if the walked path represents a schema name.
      if (/^\$$/.test(path) ||
        (/(?<=\.(where|shows)\.)\w+$/.test(path)) ||
        (/(?<=\.options)/.test(path)) ||
        (/(using|throught|shows|options|alias|properties|\d|where|groupBy|size|page|orderBy|type)$/.test(path))
      ) return;

      const schemaName = node.alias || resolveSchemaName(path);

      const schema = schemaProvider(schemaName);
      
      if (!schema) {
        throw new Error(`Could not detect schema configuration for "${schemaName}".`);
      }

      function resolveParentName(path) {
        // Ex.: $.some.path.(parentName).schema
        return path.match(/\./g).length === 1 ? null : path.match(/(\w+)\.\w+$/)[1];
      }

      function resolveSchemaName(path) {
        // Ex.: $.some.path.parentName.(schema)
        return path.split('.').pop();
      }

      const parentNodeName = resolveParentName(path);
      const parentSchema = options.parent;
      const hasParent = !!parentSchema;

      // The association with parent must be validated when a
      // schema is not the root collection of the query. The association must
      // be valid in two ways, parent has one/many of this and this belongs to parent.(for now)
      if (hasParent && !schema.haveAssociationWith(parentSchema)) {
        throw new Error(`"${schema.name}" have no relation with "${parentNodeName}".`);
      }

      function resolveAssociationOptions(schema, parent) {
        return !hasParent ? null : schema.getAssociationOptionsWith(parent);
      }

      // A QueryNode represents the real value of the node
      // inside the graph. This value will be avaiable in the query
      // node resolver.
      // In this case we are copying the schema definition and adding
      // some extra options and methods(avaible in this class) to make
      // our query resolution more easy.
      const queryNode = new QueryNode({
        name:       schema.name,
        alias:      node.alias && resolveSchemaName(path),
        hash:       schema.hash,
        tableName:  schema.tableName,
        properties: node.properties,
        schemaProperties: schema.properties,
        primaryKey: schema.primaryKey,
        options:    node.where,
        shows:      node.shows,
        staticOptions: {
          page:     node.page,
          size:     node.size,
          orderBy:  node.orderBy,
          groupBy:  node.groupBy,
        },
        parentAssociation: resolveAssociationOptions(schema, parentSchema)
      });

      // Adds a new node to the query graph. Creating a graph node
      // class is useful to loop throught the nodes in a automatic way.
      const nodeGraph = resolvedGraph.addNode(
        schema.hash,
        queryNode,
        options.lastNodeHash
      );

      // Resolvers are functions which receives a node from the graph and
      // returns a parsed query.
      // Add some defined resolvers to this graph node.
      // The "main" resolver will resolves the SQL select using the
      // json1 extension and it respectives source and joined tables.
      nodeGraph.createResolver('main', SQLitegraphNodeResolver, true);
      // The "filterId" resolver will resolve the general where clause which
      // is responsible in getting the distinct ids of the root collection which
      // will be used as filter to the query.
      nodeGraph.createResolver('filterId', SQLitegraphRootNodeOptionsResolver, false, '');
      // #
      nodeGraph.createResolver('options', SQLitegraphNodeOptionsResolver);
      // #
      nodeGraph.createResolver('groupId', SQLitegraphNodeGroupIdsResolver);
      // # count
      nodeGraph.createResolver('count', SQLitegraphCountResolver);

      // "jtree" function accepts a returned object that will be defined
      // to the next walk node. In some cases these options are used to
      // access the previous walked schema.
      return {
        lastNodeHash: schema.hash,
        lastNodeName: schema.name,
        parent: schema
      }

    });
    return resolvedGraph;
  }

  buildQuery(options = {}) {
    return this.graph.resolve('main', _.pickBy(options));
  }

  buildCountQuery(options = {}) {
    return this.graph.resolve('count', _.pickBy(options));
  }

  parseRows(rows) {
    return this.rowsParser.parse(rows);
  }

}

module.exports = Query;