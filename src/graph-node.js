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
  resolve() {
    return this.resolver(this.raw(), this, this.renderNextNodes.bind(this));
  }
  renderNextNodes() {
    return !this.nextNodes.length ? 'json_object()' : this.nextNodes.map(nextNode => nextNode.resolve()).join('');
  }
  raw() {
    return _.copy(this.node);
  }
}

module.exports = GraphNode;