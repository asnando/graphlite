const _ = require('./utils');
const debug = require('./debugger');
const QueryResolver = require('./query-resolver');

// This class represents the nodes of a graph in a unique way.
// This basically expose a resolver which is called by the graph
// class instance. The graph calls the head node and it keeps resolving
// until the last node (throught the nextNodes function).
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
    if (!this.resolvers[resolverName]) {
      throw new Error(`Undefined resolver "${resolverName}".`);
    }
    return this.resolvers[resolverName].resolve(this, options);
  }

  raw() {
    return this.node;
  }

  createResolver(name, resolver, usePatch, defaultValue) {
    this.resolvers[name] = new QueryResolver(name, resolver, usePatch, defaultValue);
  }

  walk(callback) {
    callback(this.raw());
    if (this.nextNodes.length) {
      this.nextNodes.forEach(nextNode => {
        if (_.isFunction(nextNode.walk)) nextNode.walk(callback)
      });
    }
  }

}

module.exports = GraphNode;