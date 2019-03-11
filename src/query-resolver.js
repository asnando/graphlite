const _ = require('./utils');

class QueryResolver {

  constructor(name, resolver, usePatch = false, defaultValue = 'json_object()') {
    this.name = name;
    this.resolver = resolver;
    this.usePatch = usePatch;
    this.defaultValue = defaultValue;
  }

  resolve(node, options) {
    return this.resolver(node.raw(), options, this.resolveNextNodes.bind(this, node, options), node.resolve.bind(node));
  }

  resolveNextNodes(node, options) {

    const nextNodes = node.nextNodes;

    if (!nextNodes.length) {
      return this.defaultValue;
    }

    // json_patch function only works with paired objects.
    if (nextNodes.length % 2) {
      nextNodes.push(() => this.defaultValue);
    }

    let resolvedNodes = nextNodes.map(node =>
      _.isFunction(node) ? node() : node.resolve(this.name, options))
      .map(node => this.usePatch ? `(${node})` : node)
      .join(this.usePatch ? ',' : ' ');

    if (this.usePatch) {
      resolvedNodes = `select json_patch(${resolvedNodes})`;
    }

    return resolvedNodes;
  }

}

module.exports = QueryResolver;