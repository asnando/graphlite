const assign = require('lodash/assign');

class Association {
  constructor({
    from,
    to,
    targetTable,
    targetHash,
    targetKey,
    sourceTable,
    sourceHash,
    sourceKey,
    foreignTable,
    foreignHash,
    foreignKey,
    useTargetKey,
    useSourceKey,
    objectType,
    using,
    associationType,
  }) {
    assign(this, {
      from,
      to,
      targetTable,
      targetHash,
      targetKey,
      sourceTable,
      sourceHash,
      sourceKey,
      foreignTable,
      foreignHash,
      foreignKey,
      useTargetKey,
      useSourceKey,
      objectType,
      using,
      associationType,
    });
  }
}

module.exports = Association;
