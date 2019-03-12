const _ = require('./utils');

class QueryNode {
  constructor(opts = {}) {
    _.xtend(this, {
      name: opts.name,
      hash: opts.hash,
      tableName: opts.tableName,
      primaryKey: opts.primaryKey,
      hasManyRelationsWith: opts.hasManyRelationsWith,
      hasOneRelationWith: opts.hasOneRelationWith,
      belongsToOneRelation: opts.belongsToOneRelation,
      belongsToManyRelations: opts.belongsToManyRelations,
      parentAssociation: opts.parentAssociation,
      propertiesResolver: opts.propertiesResolver,
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
  resolveFields(options) {
    return this.propertiesResolver({
      ...options,
      withId: !this.parentAssociation
    });
  }
  resolveOptions() {
    return '';
  }
}

module.exports = QueryNode;