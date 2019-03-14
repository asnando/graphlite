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

  resolve() {
    let from, join = [], where;

    const hasFK = this.foreignTable && this.foreignKey;
    const path  = this.throught;
    const isGrouped = !!this.grouped;

    // From
    from = `FROM ${this.targetTable}`;
    if (isGrouped) from += `, json_each(exported_${this.targetKey})`;

    // Joins
    if (path) {
      const sourceTable = path.foreignTable || path.sourceTable;
      join.push(`INNER JOIN ${sourceTable} ON ${sourceTable}.${path.sourceKey}=${path.sourceHash}.${path.sourceKey}`);
      join.push(`INNER JOIN ${path.targetTable} ON ${path.targetTable}.${path.targetKey}=${sourceTable}.${path.targetKey}`);
    } else if (hasFK) {
      join.push(`INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceHash}.${this.sourceKey}`);
    }

    // Where clauses for joins above
    where = isGrouped
      ? `WHERE ${this.targetTable}.${this.targetKey}=json_each.value`
      : path
        ? `WHERE ${this.targetTable}.${this.targetKey}=${path.targetTable}.${this.targetKey}`
        : hasFK
          ? `WHERE ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.foreignKey}`
          : `WHERE ${this.targetTable}.${this.targetKey}=${this.sourceHash}.${this.targetKey}`;

    return ' '.concat(from.concat(` ${join.join(' ')}`).concat(` ${where}`));
  }

  resolveJoin() {
    return (this.foreignTable && this.foreignKey)
      ? ` INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceTable}.${this.sourceKey} INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.targetKey}`
      : ` INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.sourceTable}.${this.targetKey}`;
  }

}

module.exports = Association;