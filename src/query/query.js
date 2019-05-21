const _ = require('lodash');
const jtree = require('../utils/jtree');
const hashCode = require('../utils/hash-code');

class Query {

  constructor (opts = {}) {
    if (!_.isString(opts.name)) {
      throw new Error(`Query must have a unique name. The name is missing or is not a string.`);
    }
    this.name = opts.name;
    this._createQueryGraph(opts);
  }

  _createQueryGraph(queryStructure) {
    this.graph = new Graph(queryStructure);
  }

}

module.exports = Query;

const initialGraph = {
  head: null,
  tail: null,
  depth: 0,
};

class Graph {

  constructor(structure) {
    this.graph = initialGraph;
    this._createGraphStructure(structure);
  }

  _createGraphStructure(structure) {
    let { graph } = this;

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
    
  }

  resolve() {

  }
  
}