const SQLiteGraphNodeRootResolver = require('./root-resolver');
const SQLiteGraphNodeRootCountResolver = require('./root-count-resolver');
const SQLiteGraphNodeNodeResolver = require('./node-resolver');
const SQLiteGraphNodeRootSourceWithAssociationsResolver = require('./root-source-with-associations-resolver');
const SQLiteGraphNodeSourceWithAssociationsResolver = require('./node-source-with-associations-resolver');
const SQLiteGraphNodeRootOptionsResolver = require('./root-options');

const useSQLiteResolvers = () => ({
  root: SQLiteGraphNodeRootResolver,
  rootCount: SQLiteGraphNodeRootCountResolver,
  node: SQLiteGraphNodeNodeResolver,
  rootSourceWithAssociations: SQLiteGraphNodeRootSourceWithAssociationsResolver,
  nodeSourceWithAssociations: SQLiteGraphNodeSourceWithAssociationsResolver,
  rootOptions: SQLiteGraphNodeRootOptionsResolver,
});

module.exports = useSQLiteResolvers;
