const keys = require('lodash/keys');
const isNil = require('lodash/isNil');
const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const translateSchemaPropsLiterals = require('./translate-schema-props-literals');
const useWhere = require('./use-where');

const isQueryLike = str => !/^[\w\.]+$/.test(str);
const refersToSchemaProp = (schema, propName) => schema.hasProperty(propName);
const refersToNextNodeProp = propName => /\w+\.\w+/.test(propName);

const resolveNextNodeWhereClause = (schema, queryOptions) => useWhere(schema, queryOptions);

const resolveNextSchemaFromGraphNode = (nextNodeSchemaName, node) => node.getNextNodes()
  .filter(nodeSchema => nodeSchema.name === nextNodeSchemaName)
  .map(nextNodeSchema => nextNodeSchema.getValue())
  .pop();

const mountNextNodeQueryOptions = (filterName, queryOptions) => ({
  [filterName]: queryOptions[filterName],
});

const useOrderBy = (schema, { orderBy }, queryOptions, node) => {
  const resolvedOrderBy = isString(orderBy) ? [orderBy] : orderBy;

  // Return empty string if no order by condition.
  if (!isArray(resolvedOrderBy)) return '';

  // If no props to order by then return empty string.
  if (!resolvedOrderBy.length) {
    return '';
  }

  const conditions = resolvedOrderBy.map((propName) => {
    const orderOperator = /^\W/.test(propName) ? /^\W/.match(propName) : null;
    // Remove asc/desc initial operator.
    const usePropName = propName.replace(/^\W/, '');
    let orderType = '';

    switch (orderOperator) {
      case '<':
        orderType = 'DESC';
        break;
      case '>':
      default:
        orderType = 'ASC';
        break;
    }

    // If prop name is like a query parse it as javascript literals resolving
    // the properties real names inside it.
    if (isQueryLike(usePropName)) {
      return translateSchemaPropsLiterals(usePropName, schema, queryOptions);
    }

    if (refersToSchemaProp(schema, usePropName)) {
      const prop = schema.translateToProperty(usePropName);
      const tableAlias = prop.getPropertyTableAlias();
      const propColumnName = prop.getPropertyColumnName(queryOptions);
      return `${tableAlias}.${propColumnName} ${orderType}`;
    }

    // Graphlite supports filters used by the child
    // nodes of the current node to be used right here. If can
    // be used for ordering the current node based in the following
    // child node filters. Filters must contains the next node name
    // followed by the filter name like: "nextSchema.filterName".
    if (refersToNextNodeProp(usePropName)) {
      const filter = usePropName.split('.');
      const nextNodeSchemaName = filter.shift();
      const filterName = filter.pop();
      const nextNodeQueryOptions = mountNextNodeQueryOptions(filterName, queryOptions);
      const filterValue = nextNodeQueryOptions[keys(nextNodeQueryOptions)[0]];
      // If the value of the next node filter is empty then abort.
      if (isNil(filterValue)) {
        return null;
      }
      // The 'node' argument is specific used by this function to find
      // out which is the next node schema configuration so we can
      // resolve the where conditions to use within order by options.
      const nextSchema = resolveNextSchemaFromGraphNode(nextNodeSchemaName, node);
      const nextNodeWhereClause = resolveNextNodeWhereClause(nextSchema, nextNodeQueryOptions).replace(/^where\s{0,}/i, '');
      // Conditional order by must be wrapped with a 'MAX()'
      // function to evaluate the integer that represents the
      // ordering.
      return `MAX(${nextNodeWhereClause}) DESC`;
    }

    // Refers to a schema filter.
    let condition = useWhere(schema, queryOptions);
    if (condition) {
      // Remove the where clause from the condition.
      condition = condition.replace(/WHERE\s?/, '');
      return `MAX(${condition}) DESC`;
    }
    return null;
  })
    .filter(o => !!o)
    .join(',');

  return conditions ? `ORDER BY ${conditions}` : '';
};

module.exports = useOrderBy;
