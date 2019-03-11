const debug = require('./debugger');
const  _ = require('./utils/');
const Graph = require('./graph');
const QueryNode = require('./query-node');
const Association = require('./association');

const graphNodeConditionResolver = require('./resolvers/filterId');
const graphNodeResolver = require('./resolvers/main');

// DONE: Support association with multiple schemas at the same graph level;
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

      const isSchemaNode = !/^\$$/.test(path) && !/(?<=\.where)|(?<=\.properties)|(properties|\d|where|type|(?<=has)(\w+)|(?<=\_)\w+)$/.test(path);

      if (!isSchemaNode) return;

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

      function getAssociationFromParent(schema, parentHash) {
        let parent = resolvedGraph.getNode(parentHash);
        while (parent) {
          const raw = parent.raw();
          const hasAssociation = has(raw, schema.name);
          if (hasAssociation) return hasAssociation;
          parent = parent.getParent();
        }
      }

      function getAssociationWithParent(schema, parentHash) {
        const parent = resolvedGraph.getRawNode(parentHash);
        return belongs(schema, parent.name);
      }

      function has(schema, name) {
        return schema.hasManyRelationsWith[name] || schema.hasOneRelationWith[name];
      }

      function belongs(schema, name) {
        return schema.belongsToManyRelations[name] || schema.belongsToOneRelation[name];
      }

      function haveAssociationWithParent() {
        // Returns false positive when parent node is not defined yet.
        const parentHash = options.lastNodeHash;
        if (!parentHash) return true;
        return !!getAssociationFromParent(schema, parentHash) &&
          !!getAssociationWithParent(schema, parentHash);
      }

      function resolveAssociation(schema, parentHash) {
        if (!parentHash) return null;

        const associationFromParent = getAssociationFromParent(schema, parentHash);
        const associationFromChild  = getAssociationWithParent(schema, parentHash);
        const parentOptions         = associationFromParent.options;
        const childOptions          = associationFromChild.options;
        const parentSchema          = associationFromChild.schema;
        const childSchema           = associationFromParent.schema;

        const targetHash      = childSchema.hash,
              targetTable     = childSchema.tableName,
              targetKey       = childSchema.primaryKey,
              sourceHash      = parentSchema.hash,
              sourceTable     = parentSchema.tableName,
              sourceKey       = parentSchema.primaryKey,
              foreignTable    = childOptions.foreignTable,
              foreignKey      = childOptions.foreignKey,
              associationType = parentOptions.associationType || childOptions.associationType || 'object';

        return new Association({
          targetHash,
          sourceHash,
          sourceTable,
          sourceKey,
          targetTable,
          targetKey,
          foreignTable,
          foreignKey,
          associationType,
        });
      }

      const parentNodeName = resolveParentName(path);

      if (!haveAssociationWithParent()) {
        throw new Error(`"${schemaName}" have no relation with "${parentNodeName}".`);
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
        parentAssociation: resolveAssociation(schema, options.lastNodeHash)
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
        lastNodeName: schema.name
      };
    });
    return resolvedGraph;
  }

  build(options = {}) {
    debug.alert(`Building query "${this.name}" with options: ${_.jpretty(options)}`);
    const query = this.graph.resolve('main', options);
    debug.success('Query copied to clipboard!');
    return query;
  }

}

module.exports = Query;