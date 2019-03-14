const _ = require('./utils');
const debug = require('./debugger');

const DEFAULT_OBJECT_RESPONSE_NAME = 'response';
const DEFAULT_OBJECT_TYPE = 'object';

// The QueryNode represents the real value of a node
// inside the graph of the defined query. It is responsible
// to resolve each part of the query for that specific node.
class QueryNode {

  constructor(opts = {}) {
    _.xtend(this, {
      name: opts.name,
      alias: opts.alias,
      hash: opts.hash,
      properties: opts.properties,
      tableName: opts.tableName,
      primaryKey: opts.primaryKey,
      parentAssociation: opts.parentAssociation,
      // Options definition by the query graph.
      definedOptions: opts.options,
      // Static values for options defined in the query.
      staticValues: opts.staticValues,
    });
  }

  getTableName() {
    return this.tableName;
  }

  getTableAlias() {
    return this.hash;
  }

  getObjectType() {
    return !!this.parentAssociation ? this.parentAssociation.objectType : DEFAULT_OBJECT_TYPE;
  }

  getPrimaryKey() {
    return this.primaryKey;
  }

  getFieldsAsJson() {
    // Returns format: 'fieldName', tableAlias.(fieldAlias || fieldName)
    const tableAlias = this.getTableAlias();

    return this.properties.filter(prop => {
      return !this.parentAssociation || prop.type !== 'primaryKey';
    }).map(prop => {

      let propName = prop.type === 'primaryKey' ? '_id' : prop.name,
          propValue;

      if (prop.resolver) {
        propValue = '(CASE' + prop.resolver.map(name => ` WHEN ${tableAlias}.${name} IS NOT NULL THEN ${tableAlias}.${name}`).join(' ') + ' END)';
      } else if (prop.join) {
        propValue = prop.join.join(' || ');
      } else {
        propValue = tableAlias.concat('.').concat(prop.alias || prop.name);
      }

      switch (prop.type) {
        case 'boolean':
          propValue = `(CASE WHEN ${propValue} IS NOT NULL AND ${propValue}<>0 THEN 1 ELSE 0 END)`;
          break;
        case 'integer':
          propValue = `cast(${propValue} as integer)`;
          break;
        case 'number':
          propValue = `cast(${propValue} as real)`;
          break;
      };

      return [
        _.quote(propName),
        propValue
      ].join(',');

    }).join(',');
  }

  getResponseObjectName() {
    return !this.parentAssociation ? DEFAULT_OBJECT_RESPONSE_NAME : '';
  }

  getRawFields() {
    return `${this.getTableName()}.*`;
  }

  getSource() {
    return `FROM ${this.getTableName()} ${this.getAssociation()}`;
  }

  getAssociation() {
    const association = this.parentAssociation;
    if (!association) return '';
    if (!!association.foreignTable && !!association.foreignKey) {
      return `INNER JOIN ${association.foreignTable} ON ${association.foreignTable}.${association.sourceKey}=${association.sourceHash}.${association.sourceKey} WHERE ${association.targetTable}.${association.foreignKey}=${association.foreignTable}.${association.targetKey}`;
    }
    return `WHERE ${association.targetTable}.${association.targetKey}=${association.sourceHash}.${association.targetKey}`;
  }

  getOptions(options = {}) {
    // TODO
    return '';
  }

  getAssociationName() {
    return _.quote(this.name);
  }

  getDistinctPrimaryKey() {
    return `DISTINCT ${this.getTableName()}.${this.getPrimaryKey()}`;
  }

  getRawJoin() {
    // TODO
  }

}

module.exports = QueryNode;