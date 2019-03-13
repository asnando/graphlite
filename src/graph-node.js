const _ = require('./utils');
const debug = require('./debugger');
const QueryResolver = require('./query-resolver');
class GraphNode {

  constructor(opts) {
    this.prevNode = null;
    this.nextNodes = [];
    this.node = opts.node;
    this.resolvers = {};
  }

  getParent() {
    return this.prevNode ? this.prevNode() : null;
  }

  setPreviousNode(node) {
    return this.prevNode = node;
  }

  addNextNode(node) {
    return this.nextNodes.push(node);
  }
  
  resolve(resolverName, options) {
    return this.resolvers[resolverName].resolve(this, options);
  }

  raw() {
    return this.node;
  }

  createResolver(name, resolver, usePatch, defaultValue) {
    this.resolvers[name] = new QueryResolver(name, resolver, usePatch, defaultValue);
  }

}

module.exports = GraphNode;