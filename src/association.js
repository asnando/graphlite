const _ = require('./utils');

class Association {
  constructor(opts = {}) {
    _.xtend(this, {
      targetHash:       opts.targetHash,
      sourceHash:       opts.sourceHash,
      targetTable:      opts.targetTable,
      targetKey:        opts.targetKey,
      sourceTable:      opts.sourceTable,
      sourceKey:        opts.sourceKey,
      foreignTable:     opts.foreignTable,
      foreignKey:       opts.foreignKey,
      associationType:  opts.associationType,
    });
  }
  resolve() {
    const query = (this.foreignTable && this.foreignKey)
      ? `FROM ${this.targetTable} INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceHash}.${this.sourceKey} WHERE ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.foreignKey}`
      : `FROM ${this.targetTable} WHERE ${this.targetTable}.${this.targetKey}=${this.sourceHash}.${this.targetKey}`;
    return query;
  }
  simpleJoin() {
    return (this.foreignTable && this.foreignKey)
      ? ` INNER JOIN ${this.foreignTable} ON ${this.foreignTable}.${this.sourceKey}=${this.sourceTable}.${this.sourceKey} INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.foreignTable}.${this.targetKey}`
      : ` INNER JOIN ${this.targetTable} ON ${this.targetTable}.${this.targetKey}=${this.sourceTable}.${this.targetKey}`;
  }
}

module.exports = Association;