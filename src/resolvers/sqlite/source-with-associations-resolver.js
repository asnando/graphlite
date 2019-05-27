const debug = require('../../debug');

// todo: add description
const SQLiteGraphNodeSourceWithAssociationsResolver = (
  schema,
  options,
  node,
  resolveNextNodes,
) => {
  const tableName = schema.getTableName();
  const tableAlias = schema.getTableHash();
  const parentSchemaName = node.root ? null : node.parent.getValue().getSchemaName();

  if (!node.root) {
    const resolvedAssociation = schema.getAssociationWith(parentSchemaName);
    // Nested nodes can have another schemas between associations. In that case,
    // we need to use the "using" middleware associations array to reach the associated data.
    return (resolvedAssociation.using || []).concat(resolvedAssociation)
      // todo: ignore associations with no where clause too.
      // ignore left joins and middleware schemas which root association has left join too.
      .filter((association, index, self) => (!index
        ? !/left/i.test(association.joinType)
        : !/left/i.test(self[0].joinType)))
      .map(({
        sourceTable,
        sourceHash,
        targetTable,
        targetKey,
        targetHash,
        foreignTable,
        foreignKey,
        useSourceKey,
        useTargetKey,
        joinType,
      }, index, self) => {
        if (foreignTable && foreignKey) {
          // Fix: When using foreign table it must update the last position of the array as it
          // contains the final association with the desired table. If does not change it will try
          // to join the two tables ignoring everything in the middle.
          // eslint-disable-next-line no-param-reassign
          self[self.length - 1] = {
            ...self[self.length - 1],
            sourceTable: targetTable,
            sourceHash: targetHash,
          };
          // When foreign table is defined it must join the table multiple times.
          return `
            ${joinType.toUpperCase()} JOIN ${foreignTable}
              ON ${foreignTable}.${foreignKey}=${sourceHash}.${foreignKey}
            ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash}
              ON ${targetHash}.${useTargetKey || targetKey}=${foreignTable}.${useTargetKey || targetKey}
          `;
        }
        return `
          ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash}
            ON ${targetHash}.${useTargetKey || targetKey}=${sourceHash}.${useSourceKey || targetKey}
        `;
      }).join(' ');
  }
  // Resolves root node(source).
  return `FROM ${tableName} ${tableAlias} ${resolveNextNodes()}`;
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
