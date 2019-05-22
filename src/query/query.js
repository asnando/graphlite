const _ = require('lodash');
const Graph = require('../graph/graph');

class Query {
  constructor(opts = {}) {
    if (!_.isString(opts.name)) {
      throw new Error('Query must have a unique name. The name is missing or is not a string.');
    }
    this.name = opts.name;
    this._createQueryGraph(opts);
  }

  _createQueryGraph(queryStructure) {
    this.graph = new Graph(queryStructure);
  }
}

module.exports = Query;
