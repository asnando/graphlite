const _ = require('../utils');
const debug = require('../debugger');

const DEFAULT_OBJECT_RESPONSE_NAME = 'response';
const DEFAULT_OBJECT_TYPE = 'object';
const DEFAULT_PAGE_DATA_LIMIT = 100;

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
      schemaProperties: _.defaults(opts.schemaProperties, []),
      // Merged options array.
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
      nodeOptions: _.defaults(opts.shows, {}),
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
    return '*';
    return `${this.getTableName()}.*`;
  }

  getSource(parentUseGroup) {
    return `FROM ${this.getTableName()} ${this.getAssociation(parentUseGroup)}`;
  }

  // Will render the respective associations joins inside each node of the query.
  getAssociation(parentUseGroup = false) {
    return !this.parentAssociation ? '' : _.toArray(this.parentAssociation).map((association, index, self) => {
      const bolFK = !!association.foreignTable && !!association.foreignKey;
      const joinType = association.resolveJoinType();

      if (bolFK) {
        return [
          `${joinType} JOIN ${association.foreignTable} ON ${association.foreignTable}.${association.sourceKey}=${association.sourceHash}.${association.sourceKey}`,
          self.length > 1
            ? `${joinType} JOIN ${association.targetTable} ON ${association.targetTable}.${association.targetKey}=${association.foreignTable}.${association.targetKey}`
            : `WHERE ${association.targetTable}.${association.targetKey}=${association.foreignTable}.${association.targetKey}`
        ].join(' ');
      }

      // ###
      if (parentUseGroup) {
        return `, json_each(${association.sourceHash}.id_${association.targetKey}) WHERE ${association.targetTable}.${association.targetKey}=json_each.value`;
      }

      // Note.: When association of type "belongs" then use the sourceHash (which
      // represents the previous node data) instead of the root table name.
      const sourceTableRef = /^belongs/.test(association.associationType) ? association.sourceHash : association.sourceTable;
      return `WHERE ${association.targetTable}.${association.targetKey}=${sourceTableRef}.${association.targetKey}`;
    }).join(' ');
  }

  // This join will be rendered in the root of the query (where we fetch the root
  // collection schema ids).
  getJoin() {
    if (this.parentAssociation) {
      return _.toArray(this.parentAssociation).map(association => {
        const bolFK = !!association.foreignTable && !!association.foreignKey;
        const joinType = association.resolveJoinType();
        // Quick Fix: Ignore join when it is a belongs association.
        // Gererally in that cases the asssociation have already been rendered
        // by the parent/association that have the "has" association type.
        if (/^belongs/.test(association.associationType)) {
          return '';
        } else if (bolFK) {
          return `${joinType} JOIN ${association.foreignTable} ON ${association.foreignTable}.${association.sourceKey}=${association.sourceTable}.${association.sourceKey} ${joinType} JOIN ${association.targetTable} ON ${association.targetTable}.${association.targetKey}=${association.foreignTable}.${association.targetKey}`;
        } else {
          return `${joinType} JOIN ${association.targetTable} ON ${association.targetTable}.${association.targetKey}=${association.sourceTable}.${association.targetKey}`;
        }
      }).join(' ');
    }
    return '';
  }

  getShowOptions(options) {
    options = this.resolveOptionsWithValues(this.nodeOptions, options);
    return !options.length ? '' : `AND ${options.join(' AND ')}`;
  }

  getOptions(options = {}, rendersOnly = []) {

    const self = this;

    const resolvedOptions = this.resolveOptionsWithValues(this.definedOptions, options);

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
      if (!gp || !gp.length) return '';
      return ' GROUP BY ' + gp.map(prop => {
        prop = self.getSchemaPropertyConfig(prop);
        if (!prop) {
          throw new Error(`Undefined "${prop}" property configuration on "${self.name}" schema for grouping.`);
        }
        return prop.alias || prop.name;
      }).map(prop => self.getTableName().concat('.').concat(prop));
    }

    function resolveOrderBy(order) {
      if (!order || !order.length) return '';
      return ' ORDER BY ' + order.map(prop => {
        prop = self.getSchemaPropertyConfig(prop);
        if (!prop) {
          throw new Error(`Undefined "${prop}" property configuration on "${self.name}" schema for ordering.`);
        }
        return prop.alias || prop.name;
      }).map(prop => self.getTableName().concat('.').concat(prop));
    }

    function resolveLimit(size) {
      return (!size && !!self.parentAssociation) ? ''
        : `LIMIT ${size || DEFAULT_PAGE_DATA_LIMIT}`;
    }

    const clauses = {
      where: resolveWhere(resolvedOptions),
      group: resolveGroupBy(this.staticOptions.groupBy),
      order: resolveOrderBy(this.staticOptions.orderBy),
      limit: resolveLimit(options.size || this.staticOptions.size),
      offset: resolveOffset(options.page || this.staticOptions.page, options.size || this.staticOptions.size),
    };

    // Renders only is a array within all the keys
    // from "clauses" object above which will be present
    // in the query.
    if (rendersOnly.length) {
      return rendersOnly.map(key => clauses[key]).join(' ');
    } else {
      return _.keys(clauses).map(key => clauses[key]).join(' ');
    }
  }

  resolveOptionsWithValues(def, options) {

    const definedOptionKeys = _.keys(options)
      .filter(optionName => !!def.hasOwnProperty(optionName))

    if (!definedOptionKeys.length) return '';

    const optionValues = definedOptionKeys.map(optionName => {
      const propName = def[optionName].replace(/\W/g, '');
      const propDefinitionFromSchema = this.schemaProperties.find(prop => prop.name === propName);
      const definition = def[optionName];
      const value = options[optionName];
      const resolvedPropName = propDefinitionFromSchema.alias || propDefinitionFromSchema.name;
      const operator = /\W/.test(definition) ? definition.match(/\W/)[0] : '=';

      if (!propDefinitionFromSchema) {
        throw new Error(`"${propName}" property from where clause not found in "${this.name}" schema properties.`);
      }

      const resolve = function() {
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
            return `LIKE ${_.quote('%' + value + '%')}`;
          case '#':
            return `GLOB ${_.quote(_.glob(value))}`;
          default:
            return '';
        };
      }

      return {
        name: resolvedPropName,
        definition,
        value,
        operator,
        resolve
      };

    }).map(opt => {
      return `${this.getTableName()}.${opt.name} ${opt.resolve()}`;
    });

    return optionValues;
  }

  getSchemaPropertyConfig(propName) {
    return this.schemaProperties.find(prop => prop.name === propName);
  }

  getAssociationName() {
    return _.quote(this.name);
  }

  getDistinctPrimaryKey() {
    return `DISTINCT ${this.getTableName()}.${this.getPrimaryKey()}`;
  }

  haveGroupByOption() {
    return !!this.staticOptions.groupBy;
  }

}

module.exports = QueryNode;