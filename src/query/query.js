const isString = require('lodash/isString');
const Graph = require('../graph/graph');

const createGraph = structure => new Graph(structure);

class Query {
  constructor(opts = {}) {
    const {
      name: queryName,
      type: queryType,
    } = opts;
    // 
    delete opts.name;
    delete opts.type;
    // 
    if (!isString(queryName) || /^\s{0,}$/.test(queryName)) {
      throw new Error('Query must have a unique name. The name is missing or is not a string.');
    }
    this.name = queryName;
    this.type = queryType;
    this.graph = createGraph(opts);
  }

  resolve(...args) {
    const { graph, type } = this;
    if (type === 'count') {
      const [options] = args;
      return graph.resolveGraph(options, 'rootCount');
    }
    return graph.resolveGraph(...args);
  }
}

module.exports = Query;
