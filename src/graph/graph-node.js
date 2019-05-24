const assign = require('lodash/assign');
const debug = require('../debug');

const SQLiteGraphNodeRootResolver = require('../resolvers/sqlite/root-resolver');
const SQLiteGraphNodePatchResolver = require('../resolvers/sqlite/patch-resolver');
const SQLiteGraphNodeSourceWithAssociationsResolver = require('../resolvers/sqlite/source-with-associations-resolver');

class GraphNode {
  constructor({
    name,
    hash,
    value = {
      schema: null,
    },
    parent,
    root,
  }) {
    assign(this, {
      name,
      hash,
      value,
      nextNodes: [],
      parent,
      root: !!root,
    });
    this._createResolvers();
  }

  _createResolvers() {
    this.resolvers = {
      root: SQLiteGraphNodeRootResolver,
      patcher: SQLiteGraphNodePatchResolver,
      sourceWithAssociations: SQLiteGraphNodeSourceWithAssociationsResolver,
    };
  }

  addChildren(node) {
    this.nextNodes.push(node);
  }

  isRoot() {
    return !!this.root;
  }

  _getResolver(name) {
    const { resolvers } = this;
    if (!resolvers[name]) {
      throw new Error(`Undefined ${name} resolver.`);
    }
    return this.resolvers[name];
  }

  _renderFromResolver(resolver, queryOptions = {}) {
    const nodeValue = this.getValue();
    const node = this;
    const resolveNextNodes = this.resolveNextNodes.bind(this, resolver, queryOptions);
    const resolveNode = this.resolveNode.bind(this, queryOptions);
    // nodeValue, queryOptions, node, nextNodes, resolveNode
    return resolver(nodeValue, queryOptions, node, resolveNextNodes, resolveNode);
  }

  getParent() {
    return this.parent;
  }

  getValue() {
    return this.value;
  }

  // acessed by nested nodes to know the name of its parent.
  getSchemaName() {
    return this.value.schema.getSchemaName();
  }

  getNextNodes() {
    return this.nextNodes;
  }

  resolveNode(queryOptions = {}, resolverName = 'root') {
    debug.log(queryOptions, resolverName);
    return this._renderFromResolver(this._getResolver(resolverName), queryOptions);
  }

  /**
   *
   * @param {function} resolver Represents the resolver(defined in the root resolve node).
   * @param {object} queryOptions Object containing the filters to use with query.
   * @param {object} options Specific options for graph builder.
   */
  resolveNextNodes(resolver, queryOptions = {}, options = {
    usePatch: false,
  }) {
    const { nextNodes } = this;
    if (!options.usePatch) {
      return nextNodes.map((node) => {
        const nodeValue = node.getValue();
        const resolveNextNodes = node.resolveNextNodes.bind(node, resolver, queryOptions);
        const resolveNode = node.resolveNode.bind(node, queryOptions);
        return resolver(nodeValue, queryOptions, node, resolveNextNodes, resolveNode);
      }).join(' ');
    }
    // todo: resolve next nodes using patch. It will be used when we need
    // to render the objects (merged).
    return '';
  }
}

module.exports = GraphNode;
