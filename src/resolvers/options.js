module.exports = function graphNodeOptionsResolver(node, options, nextNodes) {
  return node.getOptions(options, [ 'where' ]) + nextNodes(options);
}