const isNil = require('lodash/isNil');
const debug = require('../../debug');

const createAssociationList = (schema, parentSchemaName) => {
  const association = schema.getAssociationWith(parentSchemaName);
  return [association].concat(association.using);
};

const getParentSchemaName = node => node.parent.getValue().getSchemaName();

const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node) => {
  const parentSchemaName = getParentSchemaName(node);
  const associationList = createAssociationList(schema, parentSchemaName);
  const useMiddlewareAssociation = (associationList.length > 1);
  const parentNode = node.parent;
  const parentSchema = parentNode.getValue();

  if (!useMiddlewareAssociation) {
    const {
      sourceTable,
      sourceHash,
      sourceKey,
      targetTable,
      targetHash,
      targetKey,
      useSourceKey,
      useTargetKey,
      joinType,
      associationType,
    } = associationList[0];

    if (parentNode.isRoot()) {
      return `
        FROM (
          SELECT
            ${sourceHash}.${useSourceKey || targetKey}
        ) AS ${sourceHash}
        ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash}
        ON ${targetHash}.${useTargetKey || targetKey}=${sourceHash}.${useSourceKey || targetKey}
      `;
    }

    if (/^belongs/.test(associationType)) {
      if (parentSchema.haveGroupByOptions()) {
        return `
          FROM ${sourceTable} ${sourceHash},
          json_each(id_${sourceHash}) as id_${sourceHash}
          WHERE ${sourceHash}.${sourceKey}=id_${sourceHash}.value
        `;
      }
      return '/* todo */';
    }

    return '/* todo */';
  }

  return associationList.map((association, index, self) => {
    const {
      targetTable,
      targetHash,
      targetKey,
      sourceHash,
      foreignTable,
      foreignKey,
      joinType,
    } = association;

    // Return simple source syntax from association when first association of
    // the list. It means that this specific association will render the directly
    // association from the two schemas.
    if (!index) {
      return `FROM ${targetTable} ${targetHash}`;
    }

    let resolvedAssociation;

    // Join(s) must be different when there is a foreign table between the associations.
    if (foreignTable && foreignKey) {
      resolvedAssociation = `
        ${joinType.toUpperCase()} JOIN ${foreignTable} ON ${foreignTable}.${foreignKey}=${sourceHash}.${foreignKey}
        ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash} ON ${targetHash}.${targetKey}=${foreignTable}.${targetKey}
      `;
    } else {
      resolvedAssociation = `
        ${joinType.toUpperCase()} JOIN ${targetTable} ${targetHash} ON ${targetHash}.${targetKey}=${sourceHash}.${targetKey}
      `;
    }

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
