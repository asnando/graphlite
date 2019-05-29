const debug = require('../../debug');

// todo: add description
const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node, resolveNextNodes) => {
  if (node.isRoot()) {
    const tableName = schema.getTableName();
    const tableAlias = schema.getTableHash();
    return `FROM ${tableName} ${tableAlias} ${resolveNextNodes()}`;
  }

  return '';

  const parentSchema = node.parent.getValue();
  const parentSchemaName = parentSchema.getSchemaName();
  const resolvedAssociation = schema.getAssociationWith(parentSchemaName);

  // Nested nodes can have another tables(fk) between associations. In that case,
  // we need to use the "using" middleware tables array to reach the associated data.
  // All the associations are translated to an array of table associations.
  const associationList = ([resolvedAssociation]).concat(resolvedAssociation.using);

  return associationList
    // Ignore "left" join(s) and foreign tables that came from it.
    .filter((association, index, self) => {
      return !/left/i.test(!index ? association.joinType : self[0].joinType);
    })
    .map(({
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
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
