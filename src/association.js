const _ = require('./utils');
const debug = require('./debugger');

const DEFAULT_ASSOCIATION_JOIN_TYPE = 'inner';

// Associations contains the names from source, target 
// and foreign tables and primary keys. The methods of this class are
// responsible to resume the associations returning a SQL query
// within its respective joins.
class Association {

  constructor(opts = {}) {
    // For reference: 
    // target = the actual table which it have relation from.
    // source = the parent table which it is related to.
    // foreign = the table between the source and target.
    _.xtend(this, {
      schemaFrom:       opts.schemaFrom,
      schemaTo:         opts.schemaTo,
      sourceHash:       opts.sourceHash,
      sourceTable:      opts.sourceTable,
      sourceKey:        opts.sourceKey,
      targetHash:       opts.targetHash,
      targetTable:      opts.targetTable,
      targetKey:        opts.targetKey,
      foreignTable:     opts.foreignTable,
      foreignKey:       opts.foreignKey,
      associationType:  opts.associationType,
      objectType:       opts.objectType,
      type:             opts.type || DEFAULT_ASSOCIATION_JOIN_TYPE,
      using:            opts.using || [],
      useSourceKey:     opts.useSourceKey,
      useTargetKey:     opts.useTargetKey,
    });
  }

  resolveJoinType() {
    return this.type.toUpperCase();
  }

}

module.exports = Association;