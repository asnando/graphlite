const chunk = require('lodash/chunk');
const pair = require('../../utils/pair');
const debug = require('../../debug');

const renderPatch = (pairedNodes) => {
  debug.log(pairedNodes);
  const resolvedPairedNodes = pairedNodes.map(node => `(${node})`).join(',');
  return `
  /* begin json patch */
  json_patch(
    ${resolvedPairedNodes}
  )
  /* end json patch */
`;
};

const SQLiteGraphNodePatchResolver = (nodes) => {
  const objectDefaultValue = 'json_object()';
  return renderPatch(pair(chunk(nodes, 2), objectDefaultValue)
    .map(chunkedNodes => renderPatch(pair(chunkedNodes, objectDefaultValue))));
};

module.exports = SQLiteGraphNodePatchResolver;
