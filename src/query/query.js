const isString = require('lodash/isString');
// const debug = require('../debug');
const Graph = require('../graph/graph');

const createGraph = structure => new Graph(structure);

class Query {
  constructor(opts = {}) {
    if (!isString(opts.name)) {
      throw new Error('Query must have a unique name. The name is missing or is not a string.');
    }
    this.name = opts.name;
    this.graph = createGraph(opts);
  }

  resolve(options = {}) {
    return this.graph.resolve(options);
  }
}

module.exports = Query;
