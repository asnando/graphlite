const chunk = require('lodash/chunk');
const debug = require('../../debug');

const pair = array => (array.length === 2 ? array : array.concat('json_object'));

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
