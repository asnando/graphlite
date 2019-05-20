const _ = require('lodash');
const jtree = require('../utils/jtree');
const hashCode = require('../utils/hash-code');

class Query {

  constructor (opts = {}) {
    if (!_.isString(opts.name)) {
      throw new Error(`Query must have a unique name. The name is missing or is not a string.`);
    }
    this.name = opts.name;
    // console.log('######\n', opts, '\n######\n');
    this._createQueryGraph(opts);
  }

  _createQueryGraph(queryStructure) {
    this.graph = new Graph(queryStructure);
  }

}

module.exports = Query;

class Graph {

  constructor(structure) {
    this.graph = this._createGraphStructure(structure);
    console.log(this.graph);
  }

  _createGraphStructure(structure) {
    let graph = {
      head: null,
      tail: null,
      depth: 0,
    };

    jtree(structure, (node, path, options) => {

      if (/^\$$/.test(path)) {
        return;
      } else if (/(name|as|shows|alias|properties|\d|where|groupBy|size|page|orderBy)$/.test(path)) {
        return;
      } else if (/(?<=(where|shows))\.\w+$/.test(path)) {
        return;
      }

      const depth = _.isNil(options.depth) ? graph.depth : options.depth;

      const schemaName = path.split('.').pop();

      console.log(schemaName, depth);

      this.addNode(graph, {
        schemaName,
        depth,
      });

      return {
        depth: depth + 1
      }
    });
    return graph;
  }

  addNode(graph, payload = {}) {
    // console.log(payload);
    // console.log(graph.depth, payload.depth);
    // // Create a hash code for node.
    // const nodeHash = hashCode();
    // // Save and delete node depth number.
    // const nodeDepth = payload.depth;
    // delete payload.depth;
    // // 
    // if (!graph.nodeHead) {
    //   payload.root = true;
    //   graph.nodeHead = nodeHash;
    // }
    // payload.nextNodes = [];
    // // Set the node payload
    // graph[nodeHash] = payload;
    // // Updates the node tail only when the node depth change.
    // if (graph.depth !== nodeDepth) {
    //   graph.nodeTail = nodeHash;
    // } else if (!!graph.nodeTail) {
    //   graph[graph.nodeTail].nextNodes.push(nodeHash);
    // }
    // // Update the graph depth number.
    // graph.depth = nodeDepth;
  }

  resolve() {

  }
  
}