const assign = require('lodash/assign');

class GraphNodeResolver {
  constructor(resolver, options) {
    assign(this, {
      resolver,
      options,
    });
  }

  resolve(options = {}) {
    return this.resolver(options);
  }
}

module.exports = GraphNodeResolver;
