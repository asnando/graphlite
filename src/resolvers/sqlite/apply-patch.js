const chunk = require('lodash/chunk');
const isArray = require('lodash/isArray');
const pair = require('../../utils/pair');

const defaultObjectValue = 'json_object()';

const chunkResolver = nodes => chunk(nodes, 2).map(_chunk => pair(_chunk, defaultObjectValue));

const renderPatch = (pairedChunk) => {
  if (!isArray(pairedChunk)) {
    return '';
  }
  const resolvedChunk = pairedChunk.map(_chunk => `(${_chunk})`).join(',');
  return `
    /* begin json_patch */
      json_patch(${resolvedChunk})
    /* end json_patch */
  `;
};

const applyPatch = (nodes) => {
  if (!nodes.length) {
    return defaultObjectValue;
  }
  let chunks = chunkResolver(nodes);
  chunks = chunks.map(_chunk => renderPatch(_chunk));
  if (chunks.length === 1) {
    return chunks[0];
  }
  return applyPatch(chunks);
};

module.exports = applyPatch;
