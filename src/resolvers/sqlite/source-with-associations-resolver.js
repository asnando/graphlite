const debug = require('../../debug');

const SQLiteGraphNodeSourceWithAssociationsResolver = (node, options) => {
  const { schema } = node.getValue();
  const tableName = schema.getTableName();

  if (node.root) {
    return `FROM ${tableName}`;
  }
  return '';
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
