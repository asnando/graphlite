const translatePropsToObject = require('./helpers/translate-props-to-object');
const translatePropsToFields = require('./helpers/translate-props-to-fields');
const resolveOptions = require('./helpers/resolve-options');
const debug = require('../../debug');

const SQLiteGraphNodeNestedNodeResolver = (
  schema,
  options,
  node,
  resolveNextNodes,
  resolveNode,
) => {
  // As this resolver is called from the root node it will render for the root node too.
  // So it must be ignored when this resolver is called for the root node.
  if (node.isRoot()) {
    return resolveNextNodes();
  }

  const tableAlias = schema.getTableHash();
  const objectFields = translatePropsToObject(schema.getDefinedProperties(), tableAlias);
  let rawFields = translatePropsToFields(schema.getDefinedProperties(), tableAlias);
  const parentSchema = node.parent.getValue();
  const parentSchemaName = parentSchema.getSchemaName();
  const resolvedAssociation = schema.getAssociationWith(parentSchemaName);
  const { objectType } = resolvedAssociation;
  const resolvedOptions = resolveOptions(schema, options, node);
  const resolvedNextNodes = resolveNextNodes();

  // Resolve the key name that represents the array/object data.
  // todo: use array alias declared as "as" query object key property.
  const schemaDisplayName = schema.getDisplayName();

  if (objectType === 'array') {
    const sourceWithAssociations = resolveNode('nodeSourceWithAssociations');

    // When the node have group by condition it must group (using json_group_array function)
    // the ids from all the others associated schemas and return it to be avaiable to
    // the next nodes.
    if (/group by/i.test(resolvedOptions) && resolvedAssociation.using.length) {
      const associationList = [resolvedAssociation].concat(resolvedAssociation.using);
      rawFields += `, ${associationList.map(({
        targetHash, targetKey,
      }) => `json_group_array(${targetHash}.${targetKey}) as id_${targetHash}`).join(',')}`;
    }

    return `
      /* begin ${tableAlias} node */
      SELECT
        json_object(
          '${schemaDisplayName}',
          (
            SELECT
              json_group_array(
                json_patch(
                  json_object(${objectFields}),
                  (${resolvedNextNodes})
                )
              )
            FROM (
              SELECT
                ${rawFields}
              ${sourceWithAssociations}
              ${resolvedOptions}
            ) ${tableAlias}
          )
        )
      /* end ${tableAlias} node */
    `;
  }

  // Resolve node query when is "object" type
  // ...

  const associationWithParent = resolveNode('nodeSourceWithAssociations');
  // When there is no middleware tables between the association,
  // it renders the node source directly. It select the parent identifiers
  // to make a directly join.
  return `
    /* begin ${tableAlias} node */
    SELECT
        json_object(
          ${objectFields}
        )
      /* begin ${tableAlias} join */
      ${associationWithParent}
      /* end ${tableAlias} join */
      ${resolvedOptions}
    /* end ${tableAlias} node */
  `;
};

module.exports = SQLiteGraphNodeNestedNodeResolver;
