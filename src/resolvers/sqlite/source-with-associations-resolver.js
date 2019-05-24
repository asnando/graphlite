const debug = require('../../debug');

// todo: add description
const SQLiteGraphNodeSourceWithAssociationsResolver = (
  nodeValue,
  options,
  node,
  resolveNextNodes,
) => {
  // const { schema } = nodeValue;
  const schema = nodeValue;
  const tableName = schema.getTableName();
  const parentSchemaName = node.root ? null : node.parent.getSchemaName();

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
        targetTable,
        targetKey,
        foreignTable,
        foreignKey,
        useSourceKey,
        useTargetKey,
        joinType,
      }) => {
        if (foreignTable && foreignKey) {
          // When foreign table is defined it must join the table multiple times.
          return `
            ${joinType.toUpperCase()} JOIN ${foreignTable}
              ON ${foreignTable}.${foreignKey}=${sourceTable}.${foreignKey}
            ${joinType.toUpperCase()} JOIN ${targetTable}
              ON ${targetTable}.${useTargetKey || targetKey}=${foreignTable}.${useTargetKey || targetKey}
          `;
        }
        return `
          ${joinType.toUpperCase()} JOIN ${targetTable}
            ON ${targetTable}.${useTargetKey || targetKey}=${sourceTable}.${useSourceKey || targetKey}
        `;
      }).join(' ');
  }
  // Resolves root node(source).
  return `FROM ${tableName} ${resolveNextNodes()}`;
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
