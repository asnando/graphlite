const _ = require('./utils');
const debug = require('./debugger');

// This class is responsible to call the respective resolve
// functions and loop thought the next nodes to fully resolves
// one node from the graph.
class QueryResolver {

  constructor(name, resolver, usePatch = false, defaultValue = 'json_object()') {
    this.name = name;
    this.resolver = resolver;
    this.usePatch = usePatch;
    this.defaultValue = defaultValue;
  }

  resolve(node, options) {
    // The function defined as resolver will receive the raw
    // node(e.g QueryNode), options object(containing the where
    // clause from user), a function which will render the next nodes,
    // and a custom resolve caller which one resolver can call another
    // different resolver by its name.
    return this.resolver(
      node.raw(),
      options,
      this.resolveNextNodes.bind(this, node, options),
      node.resolve.bind(node)
    );
  }

  resolveNextNodes(node, options) {

    const nextNodes = node.nextNodes;

    // Usually the nextNodes function is always called (if when there is no next nodes).
    // In this cases, we return a default value to prevent th query from breaking.
    if (!nextNodes.length) {
      return this.defaultValue;
    }

    // "json_patch" function only works with paired objects.
    // Adds a extra empty node if it is not yet paired.
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