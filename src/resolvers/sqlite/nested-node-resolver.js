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
  const sourceWithAssociations = resolveNode('sourceWithAssociations');

  const parentSchema = node.parent.getValue();
  const parentSchemaName = parentSchema.getSchemaName();
  const resolvedAssociation = schema.getAssociationWith(parentSchemaName);
  const { objectType } = resolvedAssociation;

  if (objectType === 'array') {
    // Resolve the key name that represents the array data.
    const showAs = schema.getSchemaName();
    return `
      /* begin nested node */
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
          )
          FROM (
            SELECT
              ${rawFields}
            ${sourceWithAssociations}
          ) ${tableAlias}
        )
        /* end nested node */
    `;
  }

  return `
    /* begin nested node */
    SELECT
      json_object(
        ${objectFields}
      )
    FROM (
      SELECT
        ${rawFields}
    ) AS ${tableAlias}
    ${sourceWithAssociations}
    /* end nested node */
  `;
};

module.exports = SQLiteGraphNodeNestedNodeResolver;
