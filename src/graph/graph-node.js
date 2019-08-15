const assign = require('lodash/assign');
const useSQLiteResolvers = require('../resolvers/sqlite/use-sqlite-resolvers');
const useSQLitePatcher = require('../resolvers/sqlite/use-sqlite-patcher');

const DEFAULT_RESOLVER_NAME = 'root';

class GraphNode {
  constructor({
    name,
    hash,
    value = {
      schema: null,
    },
    parent,
    root,
  }) {
    assign(this, {
      name,
      hash,
      value,
      nextNodes: [],
      parent,
      root: !!root,
      // create a list of resolvers and patchers
      resolvers: useSQLiteResolvers(),
      patcher: useSQLitePatcher(),
    });
  }

  addChildren(node) {
    this.nextNodes.push(node);
  }

  isRoot() {
    return !!this.root;
  }

  _getResolver(name) {
    const { resolvers } = this;
    if (!resolvers[name]) {
      throw new Error(`Undefined "${name}" resolver.`);
    }
    return this.resolvers[name];
  }

  // This function effectively calls the resolver function within options.
  // A resolver must expect to receive the following arguments:
  // 0 - Value of the node aka the schema which nodes represents.
  // 1 - Object containing user inputed values for filters.
  // 2 - Raw node structure.
  // 3 - resolveNextNodes function. When called resolves all the child nodes
  // counting from that node and on.
  // 4 - resolveNode function. When called start resolving the graph and child nodes
  // with a new resolver. The resolver will be detected by the string name received by the function.
  // 5 - Custom options object. Use it to dynamic resolve nodes.
  _renderFromResolver(resolver, queryOptions = {}, node = this, options = {
    usePatch: false,
  }) {
    const nodeValue = node.getValue();
    const resolveNextNodes = node.resolveNextNodes.bind(node, resolver, queryOptions, options);
    const resolveNode = node.resolveNode.bind(node, queryOptions);
    return resolver(
      nodeValue,
      queryOptions,
      node,
      resolveNextNodes,
      resolveNode,
      options,
    );
  }

  getParent() {
    return this.parent;
  }

  getValue() {
    return this.value;
  }

  getNextNodes() {
    return this.nextNodes;
  }

  // When a node resolver is called this function will be passed in the arguments list
  // in case when the resolver must resolve another specific resolver from inside it.
  // When this function is called it will resolve the nodes from the root(always).
  resolveNode(
    // Object containing inputed values by user for filters.
    queryOptions = {},
    // The resolver name. Can receive custom name while resolving any other
    // node, in that case will start the resolution from that node until the last child.
    resolverName = DEFAULT_RESOLVER_NAME,
    // Can receive a custom object to pass down to another nodes while resolving.
    options,
  ) {
    return this._renderFromResolver(
      this._getResolver(resolverName),
      queryOptions,
      this,
      options,
    );
  }

  /**
   *
   * Function passed to the resolver. When called it will resolve a list(array) representing
   * the next nodes of the node which called it. It will use the same resolver function to
   * render the next nodes.
   *
   * @param {function} resolver Represents the resolver(defined in the root resolve node).
   * @param {object} queryOptions Object containing the filters to use with query.
   * @param {object} options Specific options for graph builder.
   */
  resolveNextNodes(
    // The resolved resolver function (detect by the root resolver
    // and passed down to this function).
    resolver,
    // Object containing inputed values by user for filters.
    queryOptions = {},
    // Custom options from the graph node resolution.
    // Note: will receive the 'usePatch' option to render multiple
    // nodes together using patcher function when needed.
    options = {},
    // This object can be defined during the nodes resolution runtime.
    // It can change for every resolved node(contains dynamic values).
    callerOptions = {},
  ) {
    const { nextNodes, patcher } = this;
    const resolvedNodes = nextNodes.map(node => this._renderFromResolver(
      resolver,
      queryOptions,
      node,
      // Merge static options from the root node and the dynamics.
      {
        ...options,
        ...callerOptions,
      },
    ));
    return options.usePatch ? patcher(resolvedNodes) : resolvedNodes.join(' ');
  }
}

module.exports = GraphNode;
