const assign = require('lodash/assign');
const constants = require('../constants');

const {
  DEFAULT_ASSOCIATION_JOIN_TYPE,
} = constants;

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
    // foreignHash,
    foreignKey,
    useTargetKey,
    useSourceKey,
    joinType = DEFAULT_ASSOCIATION_JOIN_TYPE,
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
      // foreignHash,
      foreignKey,
      useTargetKey,
      useSourceKey,
      joinType,
      objectType,
      using,
      associationType,
    });
  }
}

module.exports = Association;
