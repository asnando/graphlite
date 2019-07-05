const keys = require('lodash/keys');
const isNil = require('lodash/isNil');

// Walk while node is not the root one creating the association list.
const createAssociationList = (node) => {
  let associations = [];
  let walker = node;
  while (walker) {
    if (!walker.isRoot()) {
      const schema = walker.getValue();
      const parentSchema = walker.parent.getValue();
      const parentSchemaName = parentSchema.getSchemaName();
      const associationWithParent = schema.getAssociationWith(parentSchemaName);
      // "using" refers to middleware associations used between the directly association
      // of two schemas.
      const { using } = associationWithParent;
      if (using && using.length) {
        // When there is defined middleware associations, it must be concatenated just
        // before the association list.
        const middlewareAssociation = using[0];
        // Fix: In some cases when using the middleware associations we need to
        // force a new structure for the root schema from the association list with
        // the target(in that case) table configuration as the source for this one.
        const {
          targetTable: middlewareAssociationTargetTable,
          targetHash: middlewareAssociationTargetHash,
          targetKey: middlewareAssociationTargetKey,
        } = middlewareAssociation;
        // So... We concat the middleware associations, the root schema and the previous
        // associations after.
        associations = using.concat([{
          ...associationWithParent,
          sourceTable: middlewareAssociationTargetTable,
          sourceHash: middlewareAssociationTargetHash,
          sourceKey: middlewareAssociationTargetKey,
        }]).concat(associations);
      } else {
        // Otherwise we just prepend the root schema configuration to the association list.
        associations = [associationWithParent].concat(associations);
      }
      // if (walker === node) {
      //   // when first node it must get the directly association with parent
      //   associations = [associationWithParent].concat(associations);
      // } else if (associationWithParent.using.length) {
      //   // otherwise it will concat all the middleware associations until the root node.
      //   associations = associationWithParent.using.concat(associations);
      // }
    }
    walker = walker.parent;
  }
  return associations;
};

const haveOptionsWithValue = (filters, queryOptions) => !!keys(filters)
  .find(filterName => !isNil(queryOptions[filterName]));

// Return list of schema names detected from the actual schema defined
// options and not refers to it.
const whichSchemasOptionsRefersTo = (filters, queryOptions) => {
  return keys(filters)
    // Desconsiders static options.
    .filter(optionName => !/^static$/.test(optionName))
    // Desconsiders filters without given values(from options).
    .filter(optionName => !isNil(queryOptions[optionName]))
    // Map defined conditions of the filter
    .map((optionName) => {
      const conditions = filters[optionName];
      return Array.isArray(conditions) ? conditions : [conditions];
    })
    // Make one level array
    .reduce((a, b) => a.concat(b), [])
    // Remove conditions which have no reference to another schema.
    .filter((condition) => /\w{2,}\.\w{2,}/.test(condition))
    // Detect the schema which condition refers to.
    .map(condition => Array.from(condition.match(/(\w{2,})\.\w{2,}/))[1]);
};

// Returns if defined options from schema have any filter using any
// property from another schema(not from the actual node).
const haveAnotherSchemaReferenceOnOptions = (filters, queryOptions) => (
  !!whichSchemasOptionsRefersTo(filters, queryOptions).length
);

const createAssociationListFromSchemasList = (schema, schemaNames = []) => schemaNames
  .map((schemaName) => {
    const association = schema.getAssociationWith(schemaName);
    if (!association) {
      throw new Error(`${schema.getSchemaName()} have no association with ${schemaName} to use its properties on options`);
    }
    return association;
  });

const resolveJoinFromAssociationList = associationList => associationList.map((association) => {
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

// This resolver will be called for every graph node. When it refers to the root node,
// it will return the 'FROM' clause, otherwise it will return the join with another
// schemas(when it have any filter associated to it, otherwise associations will be
// ignored).
const SQLiteGraphNodeSourceWithAssociationsResolver = (schema, options, node, resolveNextNodes) => {
  // Check if there is at least one filter with value from this schema.
  const schemaDefinedOptions = schema.getDefinedOptions();
  const { where } = schemaDefinedOptions;

  if (node.isRoot()) {
    const tableName = schema.getTableName();
    const tableAlias = schema.getTableHash();
    let useAssociations = '';
    // In some cases the filters object could have an specific condition refering
    // to a property from another schema, and that schema could not be inside the graph.
    // In that cases it will try to figure out which schemas the options refers to
    // and will join that schemas with the actual schema. It is only resolved in the
    // root node cuz if there is another query node schemas it will have they own filters
    // references.
    if (haveAnotherSchemaReferenceOnOptions(where, options)) {
      const anotherSchemas = whichSchemasOptionsRefersTo(where, options);
      const associationList = createAssociationListFromSchemasList(schema, anotherSchemas);
      useAssociations = resolveJoinFromAssociationList(associationList);
    }
    return `FROM ${tableName} ${tableAlias} ${useAssociations} ${resolveNextNodes()}`;
  }

  // If no defined options value just return the next resolved nodes.
  if (!haveOptionsWithValue(where, options)) {
    return resolveNextNodes();
  }
  return resolveJoinFromAssociationList(createAssociationList(node));
};

module.exports = SQLiteGraphNodeSourceWithAssociationsResolver;
