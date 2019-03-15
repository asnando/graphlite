const _ = require('./utils');
const debug = require('./debugger');
const GraphNode = require('./graph-node');

// This class is a representation of a simple graph.
// We use a graph to make the loop into the queries nodes
// be more easy to compreend and resolve. Usually the head node
// resolver is called until all the nodes are resolved in a 
// recursive way.
class Graph {

  constructor() {
    this.head = null;
    this.tail = null;
    this.graph = {};
  }

  addNode(nodeHash, node, parentHash, nodeResolvers) {
    // Sets the head if not defined yet
    this.head = this.head || nodeHash;
    // Creates a node witin the hash
    node = new GraphNode({
      nodeHash,
      resolvers: nodeResolvers,
      node
    });
    // Adds the new node to the graph
    this.graph[nodeHash] = node;
    if (!!this.tail) {
      // Sets tail node as previous node
      node.setPreviousNode(this.getNode(parentHash || this.tail));
      // Add this node as the next node to the previous
      this.getNode(parentHash || this.tail).addNextNode(node);
    }
    // Updates the last registered node.
    this.tail = nodeHash;
    return node;
  }

  getNode(nodeHash) {
    return this.graph[nodeHash];
  }
  getRawNode(nodeHash) {
    return this.graph[nodeHash].raw();
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
  resolve(resolver, options) {
    return this.getHeadNode().resolve(resolver, options);
  }
  walk(callback) {
    return this.getHeadNode().walk(callback);
  }
}

module.exports = Graph;