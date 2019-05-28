const chunk = require('lodash/chunk');
const isArray = require('lodash/isArray');
const pair = require('../../utils/pair');
const debug = require('../../debug');

const renderPatch = (pairedNodes) => {
  if (!isArray(pairedNodes)) return pairedNodes;
  const resolvedPairedNodes = pairedNodes.map(node => `(${node})`).join(',');
  return `
  /* begin json patch */
  json_patch(
    ${resolvedPairedNodes}
  )
  /* end json patch */
`;
};

const SQLiteGraphNodePatchResolver = (...args) => {
  const objectDefaultValue = 'json_object()';
  const [nodes] = args;
  if (!nodes.length) {
    return objectDefaultValue;
  }
  if (nodes.length > 2) {
    return renderPatch(pair(chunk(nodes, 2), objectDefaultValue)
      .map(chunkedNodes => renderPatch(pair(chunkedNodes, objectDefaultValue))));
  }
  return renderPatch(pair(nodes, objectDefaultValue));
};

module.exports = SQLiteGraphNodePatchResolver;
