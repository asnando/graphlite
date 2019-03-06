const _ = require('./utils');
const GraphNode = require('./graph-node');
class Graph {
  constructor() {
    this.head = null;
    this.tail = null;
    this.graph = {};
  }
  addNode(nodeHash, node, nodeResolver) {
    // Sets the head if not defined yet
    this.head = this.head || nodeHash;
    // Creates a node witin the hash
    node = new GraphNode({
      nodeHash,
      resolver: nodeResolver,
      node
    });
    // Adds the new node to the graph
    this.graph[nodeHash] = node;
    if (!!this.tail) {
      // Sets tail node as previous node
      node.setPreviousNode(this.getNode(this.tail));
      // Add this node as the next node to the previous
      this.getNode(this.tail).addNextNode(node);
    }
    // Updates the tail
    this.tail = nodeHash;
  }
  getNode(nodeHash) {
    return this.graph[nodeHash];
  }
  getHeadNode() {
    return this.graph[this.getHeadNodeHash()];
  }
  getTailNode() {
    return this.graph[this.getTailNodeHash()];
  }
  getHeadNodeHash() {
    return this.head;
  }
  getTailNodeHash() {
    return this.tail;
  }
  resolve() {
    return this.getHeadNode().resolve();
  }
  walk() {

  }
}

module.exports = Graph;