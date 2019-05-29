const translatePropsToObject = require('./helpers/translate-props-to-object');
const translatePropsToFields = require('./helpers/translate-props-to-fields');
const debug = require('../../debug');

const SQLiteGraphNodeNestedNodeResolver = (
  nodeValue,
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

  const schema = nodeValue;
  const tableAlias = schema.getTableHash();
  const objectFields = translatePropsToObject(schema.getDefinedProperties(), tableAlias);
  const rawFields = translatePropsToFields(schema.getDefinedProperties(), tableAlias);

  const parentSchema = node.parent.getValue();
  const parentSchemaName = parentSchema.getSchemaName();
  const resolvedAssociation = schema.getAssociationWith(parentSchemaName);
  const { objectType } = resolvedAssociation;

  if (objectType === 'array') {
    // todo: use array alias declared as "as" query object key property.
    // Resolve the key name that represents the array data.
    const showAs = schema.getSchemaName();
    const sourceWithAssociations = resolveNode('nodeSourceWithAssociations');
    return `
      /* begin ${tableAlias} node */
      SELECT
        json_object(
          '${showAs}',
          (
            SELECT
              json_group_array(
                json_object(
                  ${objectFields}
                )
              )
            FROM (
              SELECT
                ${rawFields}
              ${sourceWithAssociations}
            ) ${tableAlias}
          )
        )
      /* end ${tableAlias} node */
    `;
  }

  const usingMiddlewareAssociations = !!resolvedAssociation.using.length;
  if (usingMiddlewareAssociations) {
    return `
      /* todo */
      /* begin ${tableAlias} node */
      json_object()
      /* end ${tableAlias} node */
    `;
  }

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
    /* end ${tableAlias} node */
  `;
};

module.exports = SQLiteGraphNodeNestedNodeResolver;
