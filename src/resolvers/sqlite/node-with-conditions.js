const resolveOptions = require('./helpers/resolve-options');

// const preventBeginningKeywords = str => str.replace(/^\s{0,}(where|and)(\s{0,}where|\s{0,}and)?\s{0,}/ig, '');

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
  const resolvedOptions = resolveOptions(schema, options, node, ['where']);
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
