const _ = require('./utils');
const debug = require('./debugger');

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
      throught:         opts.throught,
      // {Boolean} Tells if any group by is defined in the
      // query definition that uses this association.
      grouped:          !!opts.grouped,
    });
  }

  extendOptions(options) {
    if (_.keys(options).length) {
      _.xtend(this, options);
    }
  }

}

module.exports = Association;