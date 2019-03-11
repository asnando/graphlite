const debug = require('./debugger');
const  _ = require('./utils/');
const Graph = require('./graph');
const SQLFormatter = require('sql-formatter');

// DONE: Support association with multiple schemas at the same graph level;
// TODO: Create filter for root schema primary key that matches general where criteria from query;
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
        propertiesResolver: schema._resolveProperties.bind(schema),
        hasManyRelationsWith: schema.hasManyRelationsWith,
        hasOneRelationWith: schema.hasOneRelationWith,
        belongsToOneRelation: schema.belongsToOneRelation,
        belongsToManyRelations: schema.belongsToManyRelations,
        parentAssociation: resolveAssociation(schema, options.lastNodeHash)
      });

      resolvedGraph.addNode(schema.hash, queryNode, graphNodeResolver);

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
    const query = this.graph.resolve(options);
    debug.success('Query builded and copied to clipboard!');
    return query;
  }

}

function graphNodeResolver(node, options = {}) {

  // Function that will replace the query resolved by the next nodes from
  // graph in the right  place. If no nodes in the graph then it will
  // replace with the default string value.
  const renderNextNodes = this.renderNextNodes.bind(this, 'json_object()');

  const objectType = !node.parentAssociation ? 'object' : node.parentAssociation.associationType;
  const nodeName = node.name;
  const nodeAlias = node.hash;

  const struct = objectType === 'object'
    ? `select json_patch(json_object(<:fields:>), (<:next_nodes:>)) from (select <:fields_without_hash:> <:source:>) <:node_alias:>`
    : `json_object(<:node_name:>, (select json_group_array(json_patch(json_object(<:fields:>), (<:next_nodes:>))) from (select <:fields_without_hash:> <:source:>) <:node_alias:>))`;

  let query = struct
    .replace(/<:fields:>/, node.resolveFields())
    .replace(/<:fields_without_hash:>/, node.resolveFields(true, false))
    .replace(/<:next_nodes:>/, renderNextNodes())
    .replace(/<:source:>/, node.resolveSource())
    .replace(/<:node_name:>/, _.quote(nodeName))
    .replace(/<:node_alias:>/, nodeAlias);

  if (!node.parentAssociation) {
    query = SQLFormatter.format(query);
    // debug.warn(query);
    _.pbcopy(query);
  }

  return query;
}

module.exports = Query;

class QueryNode {
  constructor(opts = {}) {
    _.xtend(this, {
      name: opts.name,
      hash: opts.hash,
      tableName: opts.tableName,
      hasManyRelationsWith: opts.hasManyRelationsWith,
      hasOneRelationWith: opts.hasOneRelationWith,
      belongsToOneRelation: opts.belongsToOneRelation,
      belongsToManyRelations: opts.belongsToManyRelations,
      parentAssociation: opts.parentAssociation,
      propertiesResolver: opts.propertiesResolver,
    });
  }
  resolveSource() {
    return this.parentAssociation ? this.parentAssociation.resolve() : ` FROM ${this.tableName}`;
  }
  resolveHash() {
    return this.hash;
  }
  resolveFields(raw, useHash) {
    return this.propertiesResolver(raw, !this.parentAssociation, useHash);
  }
  resolveOptions() {
    return '';
  }
}

class Association {
  constructor(opts = {}) {
    _.xtend(this, {
      targetHash:       opts.targetHash,
      sourceHash:       opts.sourceHash,
      targetTable:      opts.targetTable,
      targetKey:        opts.targetKey,
      sourceTable:      opts.sourceTable,
      sourceKey:        opts.sourceKey,
      foreignTable:     opts.foreignTable,
      foreignKey:       opts.foreignKey,
      associationType:  opts.associationType,
    });
    debug.log(this);
  }
  resolve() {
    const query = (this.foreignTable && this.foreignKey)
      ? `FROM ${this.targetTable} INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceHash}.${this.sourceKey} WHERE ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.foreignKey}`
      : `FROM ${this.targetTable} WHERE ${this.targetTable}.${this.targetKey}=${this.sourceHash}.${this.targetKey}`;
    // debug.log(query);
    return query;
  }
}