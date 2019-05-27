const chunk = require('lodash/chunk');
const pair = require('../../utils/pair');
const debug = require('../../debug');

const renderPatch = (pairedNodes) => {
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
  return renderPatch(pair(chunk(nodes, 2)).map(chunkedNodes => renderPatch(pair(chunkedNodes))));
};

module.exports = SQLiteGraphNodePatchResolver;
