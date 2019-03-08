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
      
      if (!schema) throw new Error(`Could not detect schema configuration for "${schemaName}".`);
      
      function getParentAssociation(schema, node) {
        // Node will receive the schema node representation which will
        // have the "getParent" method to work with.
        const parent = node ? node.getParent() : resolvedGraph.getTailNode();
        // No parent found for this schema.
        if (!parent || !_.isFunction(parent.raw)) return null;
        const raw = parent.raw();
        return has(raw, schema.name) || getParentAssociation(schema, parent);
      }

      function has(schema, name) {
        return schema.hasManyRelationsWith[name] || schema.hasOneRelationWith[name];
      }

      function belongs(schema, parentNodeName) {
        return schema.belongsToOneRelation[parentNodeName] ||
          schema.belongsToManyRelations[parentNodeName];
      }

      // It must have at least one association as has(one/many) or belongsTo.
      function hasAssociation(schema) {
        const parent = getParentAssociation(schema);
        const parentName = getParentNodeName();
        // return !!parent || !!belongs(schema, parentName);
        return !!parent && !!belongs(schema, parentName);
      }

      function getParentNodeName() {
        return resolvedGraph.getTailNode().raw().name;
      }

      debug.warn(path);

      // If tail exists, means that this node is not the root of the query.
      // In this case it will check if the actual node have relation within the parent.
      if (!!resolvedGraph.tail && !hasAssociation(schema)) {
        throw new Error(`"${schema.name}" and "${getParentNodeName()}" have no association.`);
      }

      function resolveAssociationWithParent(schema) {
        // Ignores if no node registered.
        if (!resolvedGraph.tail) return null;
        const parentAssociation = getParentAssociation(schema);
        const childAssociation = belongs(schema, getParentNodeName());
        const parentSchema = childAssociation.schema;
        const childSchema = parentAssociation.schema;
        const parentOptions = parentAssociation.options;
        const childOptions = childAssociation.options;
        return new Association({
          targetHash: parentSchema.hash,
          sourceHash: childSchema.hash,
          sourceTable: childOptions.sourceTable || parentOptions.sourceTable || parentSchema.tableName,
          targetTable: childOptions.targetTable || parentOptions.targetTable || childSchema.tableName,
          foreignTable: childOptions.foreignTable || null,
          sourceKey: childOptions.sourceKey || parentOptions.sourceKey || parentSchema.primaryKey,
          targetKey: childOptions.targetKey || childSchema.primaryKey,
          foreignKey: childOptions.foreignKey || null,
          associationType: parentOptions.associationType || childOptions.associationType || 'object',
        });
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
        parentAssociation: resolveAssociationWithParent(schema)
      });
      // debug.log(queryNode);
      return resolvedGraph.addNode(schema.hash, queryNode, graphNodeResolver);
    });
    return resolvedGraph;
  }

  build(options = {}) {
    debug.alert(`Building query "${this.name}" with options: ${_.jpretty(options)}`);
    this.graph.resolve(options);
  }

}

function graphNodeResolver(node, options = {}) {

  let query = '';

  // Function that will replace the query resolved by the next nodes from
  // graph in the right  place. If no nodes in the graph then it will
  // replace with the default string value.
  const renderNextNodes = this.renderNextNodes.bind(this, 'json_object()');

  const objectType = !node.parentAssociation ? 'object' : node.parentAssociation.associationType;
  const nodeName = node.name;
  const nodeAlias = node.hash;

  const struct = objectType === 'object'
    ? `select
      json_patch(
        json_object(
          <:fields:>
        ),
        <:next_nodes:>
      )
      from (
        select
          <:fields_without_hash:>
        <:source:>
      ) <:node_alias:>`
    // ***
    : `json_object(
      <:node_name:>,
      (
        select
        json_group_array(
          json_patch(
            json_object(
              <:fields:>
            ),
            (<:next_nodes:>)
          )
        )
        from (
          select
            <:fields_without_hash:>
          <:source:>
        ) <:node_alias:>
      )
    )`;

  query = struct
    .replace(/<:fields:>/, node.resolveFields())
    .replace(/<:fields_without_hash:>/, node.resolveFields(true, false))
    .replace(/<:next_nodes:>/, renderNextNodes())
    .replace(/<:source:>/, node.resolveSource())
    .replace(/<:node_name:>/, _.quote(nodeName))
    .replace(/<:node_alias:>/, nodeAlias)

  if (!node.parentAssociation) {
    debug.warn(query);
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
      // properties: opts.properties,
      hasManyRelationsWith: opts.hasManyRelationsWith,
      hasOneRelationWith: opts.hasOneRelationWith,
      belongsToOneRelation: opts.belongsToOneRelation,
      belongsToManyRelations: opts.belongsToManyRelations,
      parentAssociation: opts.parentAssociation,
      propertiesResolver: opts.propertiesResolver,
    });
  }
  resolveSource() {
    return this.parentAssociation
      ? this.parentAssociation.resolve()
      : ` FROM ${this.tableName}`;
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
      targetHash: opts.targetHash,
      sourceHash: opts.sourceHash,
      targetTable: opts.targetTable,
      targetKey: opts.targetKey,
      sourceTable: opts.sourceTable,
      sourceKey: opts.sourceKey,
      foreignTable: opts.foreignTable,
      foreignKey: opts.foreignKey,
      associationType: opts.associationType,
    });
  }
  resolve() {
    if (this.foreignTable && this.foreignKey) {
      return `
        FROM ${this.targetTable}
        INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.targetHash}.${this.sourceKey}
        WHERE ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.foreignKey}
      `.replace(/\n\s{2,}/g, ' ');
    } else {
      return `
        FROM ${this.targetTable}
        WHERE ${this.targetTable}.${this.targetKey}=${this.targetHash}.${this.targetKey}
        `.replace(/\n\s{2,}/g, ' ');
    }
  }
}