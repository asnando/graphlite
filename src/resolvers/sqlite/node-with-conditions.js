const resolveOptions = require('./helpers/resolve-options');

const preventKeywordsInEdges = str => str
  .replace(/^(\s|and|where)+/i, '')
  .replace(/(\s|and|where)+$/i, '');

const SQLiteGrapNodeWithConditions = (
  schema,
  options,
  node,
  resolveNextNodes,
  resolveNode,
  resolverOptions,
) => {
  const depth = resolverOptions.depth || 0;
  const { maxDepth = 1 } = resolverOptions;
  const resolvedOptions = resolveOptions(schema, options, node, ['where'], { usePreservation: true });
  // Ignores the first node as it can be rendered inside the function who called this one.
  if (!depth) {
    return preventKeywordsInEdges(resolveNextNodes({ depth: depth + 1 }));
  }
  if (depth <= maxDepth) {
    const nextNodesCondition = resolveNextNodes({ depth: depth + 1 });
    return `${resolvedOptions} AND ${nextNodesCondition}`;
  }
  return resolvedOptions;
};

module.exports = SQLiteGrapNodeWithConditions;
