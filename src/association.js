const _ = require('./utils');
const debug = require('./debugger');

class Association {
  constructor(opts = {}) {
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
    });
  }

  extendOptions(options) {
    if (_.keys(options).length) {
      _.xtend(this, options);
    }
  }

  resolve() {
    let from,
        join = [],
        where;

    const hasFK = this.foreignTable && this.foreignKey;
    const path  = this.throught;

    from = `FROM ${this.targetTable}`;

    if (path) {
      const sourceTable = path.foreignTable || path.sourceTable;
      join.push(`INNER JOIN ${sourceTable} ON ${sourceTable}.${path.sourceKey}=${path.sourceHash}.${path.sourceKey}`);
      join.push(`INNER JOIN ${path.targetTable} ON ${path.targetTable}.${path.targetKey}=${sourceTable}.${path.targetKey}`);
    } else if (hasFK) {
      join.push(`INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceHash}.${this.sourceKey}`);
    }

    where = path
      ? `WHERE ${this.targetTable}.${this.targetKey}=${path.targetTable}.${this.targetKey}`
      : hasFK
        ? `WHERE ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.foreignKey}`
        : `WHERE ${this.targetTable}.${this.targetKey}=${this.sourceHash}.${this.targetKey}`;

    return ' '.concat(from.concat(` ${join.join(' ')}`).concat(` ${where}`));
  }

  simpleJoin() {
    return (this.foreignTable && this.foreignKey)
      ? ` INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceTable}.${this.sourceKey} INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.targetKey}`
      : ` INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.sourceTable}.${this.targetKey}`;
  }

}

module.exports = Association;