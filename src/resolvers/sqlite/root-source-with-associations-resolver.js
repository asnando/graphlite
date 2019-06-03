const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const debug = require('../../debug');

const createAssociationList = (node) => {
  let associations = [];
  let walker = node;
  while (walker) {
    if (!walker.isRoot()) {
      const schema = walker.getValue();
      const parentSchema = walker.parent.getValue();
      const parentSchemaName = parentSchema.getSchemaName();
      const associationWithParent = schema.getAssociationWith(parentSchemaName);
      if (walker === node) {
        // when first node it must get the directly association with parent
        associations = [associationWithParent].concat(associations);
      } else if (associationWithParent.using.length) {
        // otherwise it will concat all the middleware associations until the root node.
        associations = associationWithParent.using.concat(associations);
      }
    }
    walker = walker.parent;
  }
  return associations;
};

const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node, resolveNextNodes) => {
  // Imediatelly returns the source table from.
  if (node.isRoot()) {
    const tableName = schema.getTableName();
    const tableAlias = schema.getTableHash();
    return `FROM ${tableName} ${tableAlias} ${resolveNextNodes()}`;
  }

  // Check if there is at least one filter with value from this schema.
  const schemaDefinedOptions = schema.getDefinedOptions();
  const { where } = schemaDefinedOptions;
  const match = !!keys(where).find(filterName => !isNil(options[filterName]));

  // If no defined options value just return the next resolved nodes.
  if (!match) return resolveNextNodes();

  const associationList = createAssociationList(node);

  return associationList
    .map((association) => {
      const {
        sourceHash,
        targetTable,
        targetKey,
        targetHash,
        foreignTable,
        foreignKey,
        useSourceKey,
        useTargetKey,
        joinType,
      } = association;
      if (foreignTable && foreignKey) {
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
