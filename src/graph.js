const _ = require('./utils');
const debug = require('./utils/debug'),
      warn  = require('./utils/warn');

class Graph {
  constructor() {
    this._rootNode = null;
    this._lastNode = null;
    this.graph = {};
  }
  addNode(nodeHash, node) {
    if (!this._rootNode) {
      this._rootNode = nodeHash;
    }
    if (this._lastNode) {
      node._prevNode = this._lastNode;
      this.graph[node._prevNode]._nextNodes.push(node);
    }
    node.parent = !this._lastNode ? this.getNode.bind(this, null) : this.getNode.bind(this, node._prevNode);
    node._nextNodes = [];
    this.graph[nodeHash] = node;
    this._lastNode = nodeHash;
  }
  getNode(nodeHash) {
    const node = this.graph[nodeHash];
    if (_.isDef(node)) {
      node.resolveNextNodes = this._resolveNextNodes;
    }
    return node;
  }
  getRootNodeHash() {
    return this._rootNode;
  }
  walk(walker, nodeHash = this.getRootNodeHash()) {
    if (!_.isFunction(walker)) return;
    const node = this.getNode(nodeHash);
    walker(node);
    if (node._nextNodes.length) {
      node._nextNodes.forEach(nextNode => this.walk(walker, nextNode));
    }
  }
  _resolveNextNodes() {
    return this._nextNodes.map(nextNode => nextNode.resolve()).join('');
  }
}

module.exports = Graph;