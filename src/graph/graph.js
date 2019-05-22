const isObject = require('lodash/isObject');
const keys = require('lodash/keys');
const jset = require('lodash/set');
const jget = require('lodash/get');
const isNil = require('lodash/isNil');
const jtree = require('../utils/jtree');
const debug = require('../debug');
const hashCode = require('../utils/hash-code');
const schemaList = require('../jar/schema-list');

const initialGraph = {
  head: null,
  tail: null,
  depth: 0,
};

class Graph {
  constructor(structure) {
    this.graph = initialGraph;
    this._createGraphStructure(structure);
    // debug.log(this.graph);
  }

  // It will mutate the graph using the query specification.
  _createGraphStructure(structure) {
    const { graph } = this;
    jtree(structure, (node, path) => {
      // If empty path, or end with "..." or have some specific keywords in the middle of it.
      if (/^\$$|(name|as|shows|alias|properties|\d|where|groupBy|size|page|orderBy)$|(?<=(where|shows))\.\w+$/.test(path)) {
        return;
      }
      const schemaName = path.split('.').pop();
      // Resolve the schema from the schemas list using its name.
      const schema = schemaList.getSchema(schemaName);
      // Creates a new hash code for the current specific node.
      const nodeHash = hashCode();
      // Parent schema will be present in the path when there is more than 1 ".", in that case
      // resolve the parent schema name to access the previous graph node.
      const parentSchemaName = /(\w+\.){1,}/.test(path) ? path.split('.').slice(-2, -1).shift() : null;
      // // Resolve the parent node using its name.
      // const parentNode = parentSchemaName ? this.getNodeByName(parentSchemaName) : null;
      this._addGraphNode(schemaName, nodeHash, {
        schema,
      }, parentSchemaName);
    });
    return graph;
  }

  _addGraphNode(name = '', hash = hashCode(), value = {}, parent) {
    const { graph } = this;
    // Set the graph head node hash when not defined yet.
    if (!graph.head) jset(graph, 'head', hash);
    // Creates a new node.
    jset(graph, hash, {
      name,
      hash,
      value,
      nextNodes: [],
    });
    // Add the current node hash inside the previous node "nextNodes" array. It will
    // show the way to walk into the graph.
    if (!isNil(parent)) {
      const parentNode = this.getNodeByName(parent) || this.getNodeByHash(parent);
      parentNode.nextNodes.push(hash);
    }
    // Updates the tail.
    jset(graph, 'tail', hash);
  }

  getNodeByName(name) {
    const { graph } = this;
    const match = keys(graph).find((nodeHash) => {
      if (isObject(graph[nodeHash]) && graph[nodeHash].name === name) {
        return true;
      }
      return false;
    });
    return match ? jget(graph, match) : null;
  }

  getNodeByHash(hash) {
    const { graph } = this;
    return jget(graph, hash);
  }

  resolve() {
    debug.log(this.graph);
  }
}

module.exports = Graph;
