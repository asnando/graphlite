const assign = require('lodash/assign');
const debug = require('../debug');
const GraphNodeResolver = require('./graph-node-resolver');

const SQLiteGraphNodeRootResolver = require('../resolvers/sqlite/root-resolver');
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
      root: new GraphNodeResolver(SQLiteGraphNodeRootResolver),
      sourceWithAssociations: new GraphNodeResolver(SQLiteGraphNodeSourceWithAssociationsResolver),
    };
  }

  addChildren(node) {
    this.nextNodes.push(node);
  }

  isRoot() {
    return !!this.root;
  }

  _getResolver(name) {
    return this.resolvers[name];
  }

  getParent() {
    return this.parent;
  }

  getValue() {
    return this.value;
  }

  getNextNodes() {
    return this.nextNodes;
  }

  resolveNode(options = {}, resolverName = 'root') {
    debug.log(`Using "${resolverName}" resolver with ${JSON.stringify(options, null, 2)} options`);
    const resolver = this._getResolver(resolverName);
    if (!resolver) {
      throw new Error(`Undefined "${resolverName}" resolver.`);
    }
    return resolver.resolve(this, options);
  }
}

module.exports = GraphNode;
