const debug = require('../../debug');

const createAssociationList = (schema, parentSchemaName) => {
  const association = schema.getAssociationWith(parentSchemaName);
  return [association].concat(association.using);
};

const hasMiddlewareAssociation = associationList => associationList[0].using.length > 1;

const getParentSchemaName = node => node.parent.getValue().getSchemaName();

const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node) => {
  const parentSchemaName = getParentSchemaName(node);
  const associationList = createAssociationList(schema, parentSchemaName);
  const useMiddlewareAssociation = hasMiddlewareAssociation(associationList);

  if (useMiddlewareAssociation) {
    const {
      sourceHash,
      targetTable,
      targetHash,
      targetKey,
      useSourceKey,
      useTargetKey,
      joinType,
    } = associationList[0];
    return `
      FROM (
        SELECT
          ${sourceHash}.${useSourceKey || targetKey}
      ) AS ${sourceHash}
      ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash}
      ON ${targetHash}.${useTargetKey || targetKey}=${sourceHash}.${useSourceKey || targetKey}
    `;
  }

  return associationList.map((association, index, self) => {
    const {
      targetTable,
      targetHash,
      targetKey,
      sourceHash,
      joinType,
    } = association;

    // Return simple source syntax from association when first association of
    // the list. It means that this specific association will render the directly
    // association from the two schemas.
    if (!index) {
      return `FROM ${targetTable} ${targetHash}`;
    }

    let resolvedAssociation;

    // Otherwise, it will render all the middle associations between they.
    resolvedAssociation = `
      ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash}
      ON ${targetHash}.${targetKey}=${sourceHash}.${targetKey}
    `;

    // As we are using the simple "FROM" table for the first index of list, it
    // must make the "join" with this source table using the "WHERE" condition when it
    // it the last association from the list.
    if ((self.length - 1) === index) {
      const rootAssociation = self[0];
      resolvedAssociation += `WHERE ${rootAssociation.targetHash}.${rootAssociation.targetKey}=${targetHash}.${rootAssociation.targetKey}`;
    }

    return resolvedAssociation;
  }).join('');
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
