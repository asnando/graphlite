const applyPatch = require('./apply-patch');

const SQLiteGraphNodePatchResolver = nodes => applyPatch(nodes);

module.exports = SQLiteGraphNodePatchResolver;
