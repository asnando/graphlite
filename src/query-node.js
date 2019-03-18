const _ = require('./utils');
const debug = require('./debugger');

const DEFAULT_OBJECT_RESPONSE_NAME = 'response';
const DEFAULT_OBJECT_TYPE = 'object';

// The QueryNode represents the real value of a node
// inside the graph of the defined query. It is responsible
// to resolve each part of the query for that specific node.
class QueryNode {

  constructor(opts = {}) {
    // TODO: Check if properties array have at least one property.
    _.xtend(this, {
      name: opts.name,
      alias: opts.alias,
      hash: opts.hash,
      properties: opts.properties,
      schemaProperties: _.defaults(opts.schemaProperties, []),
      definedProperties: this._resolvePropertiesDefinition(
        opts.schemaProperties,
        opts.properties
      ),
      tableName: opts.tableName,
      primaryKey: opts.primaryKey,
      parentAssociation: opts.parentAssociation,
      // Defined options refers to the "where conditions"
      // definition of the query. It will be a object within
      // the property name to filter and the respective key name
      // that will be received by the find methods.
      definedOptions: _.defaults(opts.options, {}),
      // Static values defined for [size, orderBy, groupBy, page]
      // inside the query graph.
      staticOptions: opts.staticOptions,
    });
  }

  // Merge the options array defined in the query graph and
  // properties from schema. After the merge it translate
  // the properties to the final model which will be used
  // in the query construction.
  _resolvePropertiesDefinition(schemaProperties, props) {
    function matchSchemaProp(propName, schemaProperties) {
      return schemaProperties.find(prop => prop.name === propName);
    }
    return (!props || _.isString(props))
      ? schemaProperties
      : props
        .filter(propName => matchSchemaProp(propName, schemaProperties))
        .map(propName => matchSchemaProp(propName, schemaProperties));
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

    return this.definedProperties.filter(prop => {
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

  getJoin() {
    const association = this.parentAssociation;
    if (!!association.foreignTable && !!association.foreignKey) {
        return `INNER JOIN ${association.foreignTable} ON ${association.foreignTable}.${association.sourceKey}=${association.sourceTable}.${association.sourceKey} INNER JOIN ${association.targetTable} ON ${association.targetTable}.${association.foreignKey}=${association.foreignTable}.${association.targetKey}`;
    }
    return `INNER JOIN ${association.targetTable} ON ${association.targetTable}.${association.targetKey}=${association.sourceTable}.${association.targetKey}`;
  }

  getOptions(options = {}, rendersOnly = []) {

    const self = this;

    function resolveOptions(def, options) {
      return _.keys(options)
        .filter(optionName => !!def.hasOwnProperty(optionName))
        .map(optionName => {
          const definition = def[optionName];
          const name = definition.replace(/\W/g, '');
          const value = options[optionName];
          const operator = /\W/.test(definition) ? definition.match(/\W/)[0] : '=';
          return {
            name,
            definition,
            value,
            operator,
            resolve: function() {
              const operator = this.operator,
                    value    = this.value;
              switch (operator) {
                case '=':
                  return `=${_.quote(value)}`;
                case '<>':
                  return `<>${_.quote(value)}`;
                case '>':
                  return `>${value}`;
                case '<':
                  return `<${value}`;
                case '%':
                  return `LIKE ${_.quote(value)}`;
                case '#':
                  return `GLOB ${_.quote(_.glob(value))}`;
                default:
                  return '';
              };
            }
          }
        })
        .map(opt => {
          return `${self.getTableName()}.${opt.name} ${opt.resolve()}`;
        });
    }

    const resolvedOptions = resolveOptions(this.definedOptions, options);

    function resolveWhere(options) {
      return (options && options.length)
        ? ' WHERE '.concat(options.join(' AND '))
        : '';
    }

    function resolveOffset(page, size) {
      return (page && size)
        ? ' OFFSET '.concat(((page - 1) * size))
        : '';
    }

    function resolveGroupBy(gp) {
      return (gp && gp.length)
        ? ' GROUP BY '.concat(gp.map(prop => self.getTableName().concat('.').concat(prop)))
        : '';
    }

    function resolveOrderBy(order) {
      return (order && order.length)
        ? ' ORDER BY '.concat(order.map(prop => self.getTableName().concat('.').concat(prop)))
        : '';
    }

    function resolveLimit(size) {
      size = size || 100;
      return `LIMIT ${size}`;
    }

    const where  = resolveWhere(resolvedOptions),
          group  = resolveGroupBy(this.staticOptions.groupBy),
          order  = resolveOrderBy(this.staticOptions.orderBy),
          limit  = resolveLimit(this.staticOptions.size),
          offset = resolveOffset(this.staticOptions.page, limit);

    const clauses = {
      where,
      group,
      order,
      limit,
      offset,
    };

    if (rendersOnly.length) {
      return rendersOnly.map(key => clauses[key]).join(' ');
    } else {
      return _.keys(clauses).map(key => clauses[key]).join(' ');
    }
  }

  getAssociationName() {
    return _.quote(this.name);
  }

  getDistinctPrimaryKey() {
    return `DISTINCT ${this.getTableName()}.${this.getPrimaryKey()}`;
  }

}

module.exports = QueryNode;