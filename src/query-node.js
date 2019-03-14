const _ = require('./utils');
const debug = require('./debugger');

// The QueryNode represents the real value of a node
// inside the graph of the defined query. It is responsible
// to resolve each part of the query for that specific node.
class QueryNode {

  constructor(opts = {}) {
    _.xtend(this, {
      name:                   opts.name,
      alias:                  opts.alias,
      hash:                   opts.hash,
      tableName:              opts.tableName,
      primaryKey:             opts.primaryKey,
      hasManyRelationsWith:   opts.hasManyRelationsWith,
      hasOneRelationWith:     opts.hasOneRelationWith,
      belongsToOneRelation:   opts.belongsToOneRelation,
      belongsToManyRelations: opts.belongsToManyRelations,
      parentAssociation:      opts.parentAssociation,
      // This resolver is a function import from the schema class.
      // It's more easy to resolve the fields to be selected by the query
      // in that class as it already have the full fields definition.
      propertiesResolver:     opts.propertiesResolver,
      // Options definition by the query graph.
      definedOptions:         opts.options,
      // Static values for options defined in the query.
      staticOptions:          opts.staticOptions,
    });
  }

  resolvePrimaryKey() {
    return this.primaryKey;
  }

  resolveSource() {
    return this.parentAssociation ? this.parentAssociation.resolve() : ` FROM ${this.tableName}`;
  }

  resolveHash() {
    return this.hash;
  }

  resolveFields(options, parentAssociation) {
    return this.propertiesResolver({
      ...options,
      withId: !this.parentAssociation,
    }, parentAssociation);
  }
  
  resolveOptions(options = {}) {

    const tableName = this.tableName;

    const where   = this.definedOptions.where,
          size    = this.definedOptions.size,
          page    = this.definedOptions.page,
          orderBy = this.definedOptions.orderBy,
          groupBy = this.staticOptions.groupBy || options.groupBy;

    let resolvedOptions = {
      where: resolveConditionOptions(where, options, this.parentAssociation ? ' AND ' : null),
      limit: resolveLimitOption(size),
      offset: resolveOffsetOption(page, size),
      orderBy: resolveOrderByOption(tableName, orderBy),
      groupBy: resolveGroupByOption(tableName, groupBy)
    };

    // Put options in array to ensure that each
    // fields are respecting query options default order.
    return [
      resolvedOptions.where,
      resolvedOptions.groupBy,
      resolvedOptions.orderBy,
      resolvedOptions.limit,
      resolvedOptions.offset
    ].join(' ');
  }
}

function resolveGroupByOption(tableName, fields) {
  fields = _.isArray(fields)
    ? fields.map(field => `${tableName}.${field}`).join(',')
    : fields
      ? tableName.concat('.').concat(fields)
      : null;
  return fields ? `GROUP BY ${fields}` : '';
}

function resolveOrderByOption(tableName, fields) {
  return fields ? `ORDER BY ${tableName}.${fields}` : '';
}

function resolveLimitOption(size) {
  return _.isDef(size) ? `LIMIT ${size}` : '';
}

function resolveOffsetOption(page, size) {
  return !!page ? `offset ${(page - 1) * size}` : '';
}

// This function receives the definitions registerd in the query
// instance for the where clauses and a object within the options values.
function resolveConditionOptions(definition, options, concatString) {

  if (!definition || !options) return '';

  let conds = _.keys(options).map(option => {
    const value = options[option];
    const fieldName = getFieldNameFromDefinition(definition, option);
    const valueWithQuotes = value.replace(/(^\W+)(\w+)/, '$1\'$2\'');
    return `${fieldName}${valueWithQuotes}`;
  }).join(' AND ');

  return conds.length ? (concatString || 'WHERE ').concat(conds) : '';
}

function getFieldNameFromDefinition(definition, name) {
  return _.keys(definition).find(key => definition[key] === name);
}

module.exports = QueryNode;