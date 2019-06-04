const _ = require('../utils');
const debug = require('../debugger');

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

  resolve(node, options, parent) {
    // The function defined as resolver will receive the raw
    // node(e.g QueryNode), options object(containing the where
    // clause from user), a function which will render the next nodes,
    // and a custom resolve caller which one resolver can call another
    // different resolver by its name.
    return this.resolver(
      node.raw(),
      options,
      this.resolveNextNodes.bind(this, node, options, node.raw()),
      node.resolve.bind(node),
      parent,
    );
  }

  resolveNextNodes(node, options, parent) {

    let nextNodes = node.nextNodes;

    const usePatch = this.usePatch;
    const defaultValue = this.defaultValue;

    // Usually the nextNodes function is always called (if when there is no next nodes).
    // In this cases, we return a default value to prevent th query from breaking.
    if (!nextNodes.length) {
      return this.defaultValue;
    }

    // "json_patch" function only works with paired objects.
    // Adds a extra empty node if it is not yet paired.
    // Create paired array ignoring missing data on each pair.
    nextNodes = _.pair(nextNodes, false, defaultValue);

    // Resolve the query value of each node.
    let resolvedNodes = nextNodes.map(pair => {
      return pair.map(node => {
        return _.isFunction(node.resolve) ? node.resolve(this.name, options, parent) : node;
      });
    });

    if (!usePatch) {
      resolvedNodes = resolvedNodes.map(value => value.join(' ')).join(' ');
    } else {
      resolvedNodes = resolvedNodes.map(nodes => {
        nodes = nodes.map(node => {
          return (!/^\(/.test(node) && !/\)$/.test(node)) ? `(${node})` : node;
        });
        if (nodes.length > 1) {
          return `/* begin json_patch #3 */ json_patch(${nodes.join(',')}) /* end json_patch #3 */`;
        } else {
          return nodes[0];
        }
      });
      resolvedNodes = (resolvedNodes.length > 1) ? `/* begin json_patch #4 */ json_patch(${resolvedNodes}) /* end json_patch #4 */` : resolvedNodes[0];
    }
      
    return resolvedNodes;
  }

}

module.exports = QueryResolver;