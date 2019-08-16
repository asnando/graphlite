const translatePropsToObject = require('./helpers/translate-props-to-object');
const translatePropsToFields = require('./helpers/translate-props-to-fields');
const resolveOptions = require('./helpers/resolve-options');
const {
  ROW_MATCH_OBJECT_KEY_NAME,
} = require('../../constants');

const SQLiteGraphNodeNestedNodeResolver = (
  schema,
  options,
  node,
  resolveNextNodes,
  resolveNode,
) => {
  // As this resolver is called from the root node it will render for the root node too.
  // So it must be ignored when this resolver is called for the root node.
  if (node.isRoot()) return resolveNextNodes();

  const optionsTypes = ['limit', 'offset', 'groupBy', 'orderBy'];

  const tableAlias = schema.getTableHash();
  let objectFields = translatePropsToObject(schema.getDefinedProperties(), tableAlias);
  let rawFields = translatePropsToFields(schema.getDefinedProperties(), tableAlias, options);
  const parentSchema = node.parent.getValue();
  const parentSchemaName = parentSchema.getSchemaName();
  const resolvedAssociation = schema.getAssociationWith(parentSchemaName);
  const { objectType } = resolvedAssociation;
  // Resolve the node options ignoring the 'where' clause as it will be already
  // rendered by the graph root node.
  let resolvedOptions = resolveOptions(schema, options, node, optionsTypes);
  const resolvedNextNodes = resolveNextNodes();

  // Resolve the key name that represents the array/object data.
  const schemaDisplayName = schema.getDisplayName();

  const conditions = resolveOptions(schema, options, node, ['where']);
  const containsWhereConditions = /^\s{0,}where/i.test(conditions);
  if (containsWhereConditions) {
    // Support nested object/array match highlight.
    // When query options constains a value that refers to any of this node filters
    // we add a match property to the node response object which means that
    // the specific result was found by a match using the filter.
    objectFields = `'${tableAlias}.${ROW_MATCH_OBJECT_KEY_NAME}', ${tableAlias}.${ROW_MATCH_OBJECT_KEY_NAME}, ${objectFields}`;
    rawFields += `, CAST(${conditions.replace(/where/i, '')} AS boolean) AS ${ROW_MATCH_OBJECT_KEY_NAME}`;
    // Prepend the where conditions with the others resolved options.
    // resolvedOptions = `${conditions} ${resolvedOptions}`;
    const resolvedConditionsWithPreservation = resolveOptions(schema, options, node, ['where'], { usePreservation: true });
    resolvedOptions = `${resolvedConditionsWithPreservation} ${resolvedOptions}`;
  }

  // If current node have group by options which are aggregating the next node
  // objects then use the next node where conditions inside this node too.
  if (schema.haveGroupByOptions()) {
    const nextNodesConditions = resolveNode('nodeWithConditions', { maxDepth: 1 });
    if (nextNodesConditions) {
      if (containsWhereConditions) {
        // Append the next nodes conditions after the where clause and before
        // all the others options.
        resolvedOptions = resolvedOptions
          .replace(/(group\sby|order\sby|limit|offset|$)/i, `
            /* begin next nodes restriction */
            AND ${nextNodesConditions}
            /* end next nodes restriction */
            $1
          `);
      } else {
        // Prepend the where conditions resolved from next graph nodes into this node.
        resolvedOptions = `WHERE ${nextNodesConditions} ${resolvedOptions}`;
      }
    }
  }

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

    // Use the filters with inputed values from query options. As 'sourceWithAssociations'
    // may contain a WHERE it is needed to replace that word with an AND
    // to concatenate the new resolved where clause conditions before using
    // the 'sourceWithAssociations'.
    if (/where/i.test(sourceWithAssociations) && /where/i.test(resolvedOptions)) {
      resolvedOptions = resolvedOptions.replace(/^where/i, 'AND');
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

  // Resolve node query when is 'object' type
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
