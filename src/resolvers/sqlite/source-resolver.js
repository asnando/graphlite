const SQLiteSourceResolver = (schema, options, node, resolveNextNodes) => {
  if (!node.isRoot()) return '';
  const tableName = schema.getTableName();
  const tableAlias = schema.getTableHash();
  return `FROM ${tableName} ${tableAlias} ${resolveNextNodes()}`;
};

module.exports = SQLiteSourceResolver;
