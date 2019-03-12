const debug = require('./debugger');
const  _ = require('./utils/');
const Graph = require('./graph');
const QueryNode = require('./query-node');
const Association = require('./association');

const graphNodeConditionResolver = require('./resolvers/filterId');
const graphNodeResolver = require('./resolvers/main');

// DONE: Support association with multiple schemas at the same graph level;
// DONE: Create associations on schema class not query;
// DONE: Accept association throught another association;
// TODO: Supports grouped multilevel association;
// TODO: Get all primary key values for the main node using where condition with joins before the fields select;
// TODO: Add group by json support;
// TODO: Add fixed and global filters;
// TODO: Accept options like: where, orderBy, size, page, groupBy;
// TODO: Parse response with support for column value parser and data type;
// TODO: Remove mandatory two way association connection (has and belongs);
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

    _.jtree(graph, (node, path, options) => {

      // Check if node path referes to schema node name.
      if (
        // root path
        (/^\$$/.test(path)) ||
        // (/(?<=\.where)$/.test(path)) ||
        // (/(?<=\.properties)$/.test(path)) ||
        // ends with
        (/(properties|\d|where|groupBy|size|page|orderBy|type)$/.test(path))
      ) return;

      const schemaName = resolveSchemaName(path);

      // Resolves the schema graph
      const schema = schemaProvider(schemaName);
      
      if (!schema) {
        throw new Error(`Could not detect schema configuration for "${schemaName}".`);
      }

      function resolveParentName(path) {
        return path.match(/\./g).length === 1 ? null : path.match(/(\w+)\.\w+$/)[1];
      }

      function resolveSchemaName(path) {
        return path.split('.').pop();
      }

      const parentNodeName = resolveParentName(path);
      const parentSchema = options.parent;
      const hasParent = !!parentSchema;

      // Checks if this schema have association within the parent schema.
      if (hasParent && !schema.haveAssociationWithParent(parentSchema)) {
        throw new Error(`"${schema.name}" have no relation with "${parentNodeName}".`);
      }

      function resolveAssociation(schema, parent) {
        if (!hasParent) return null;
        // debug.alert(`Resolving association between ${schema.name} and ${parent.name}`);
        const fromParent = parent.getAssociationFromParent(schema);
        const fromChild = schema.getAssociationWithParent(parent);
        return mergeAssociationOptions(fromChild, {
          objectType: fromParent ? fromParent.objectType : fromChild.objectType
        });
      }

      function mergeAssociationOptions(withOptions = {}, fromOptions = {}) {
        return _.xtend(withOptions, fromOptions);
      }

      const queryNode = new QueryNode({
        name: schema.name,
        hash: schema.hash,
        tableName: schema.tableName,
        properties: schema.properties,
        primaryKey: schema.primaryKey,
        propertiesResolver: schema._resolveProperties.bind(schema),
        hasManyRelationsWith: schema.hasManyRelationsWith,
        hasOneRelationWith: schema.hasOneRelationWith,
        belongsToOneRelation: schema.belongsToOneRelation,
        belongsToManyRelations: schema.belongsToManyRelations,
        parentAssociation: resolveAssociation(schema, parentSchema)
      });

      const nodeGraph = resolvedGraph.addNode(
        schema.hash,
        queryNode,
        options.lastNodeHash
      );

      nodeGraph.createResolver('main', graphNodeResolver, true);
      nodeGraph.createResolver('filterId', graphNodeConditionResolver);

      // The returned options object will be avaiable to the next walked node.
      return {
        lastNodeHash: schema.hash,
        lastNodeName: schema.name,
        parent: schema
      };
    });
    return resolvedGraph;
  }

  build(options = {}) {
    debug.alert(`Building query "${this.name}" with options: ${_.jpretty(options)}`);
    const query = this.graph.resolve('main', options);
    // debug.success(query);
    debug.success('Query copied to clipboard!');
    return query;
  }

}

module.exports = Query;