const _ = require('./utils');
class GraphNode {
  constructor(opts) {
    this.prevNode = null;
    this.nextNodes = [];
    this.node = opts.node;
    this.resolver = opts.resolver;
  }
  getParent() {
    return this.prevNode ? this.prevNode.raw() : null;
  }
  setPreviousNode(node) {
    return this.prevNode = node;
  }
  addNextNode(node) {
    return this.nextNodes.push(node);
  }
  resolve(options) {
    return this.resolver.apply(this, [ this.raw(), options ]);
  }
  renderNextNodes(dflt) {
    return !this.nextNodes.length ? dflt : this.nextNodes.map(nextNode => nextNode.resolve()).join('');
  }
  raw() {
    return this.node;
  }
}

module.exports = GraphNode;