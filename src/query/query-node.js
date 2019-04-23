const _ = require('../utils');
const debug = require('../debugger');

const _const = require('../constants');
const DEFAULT_OBJECT_TYPE = _const.DEFAULT_OBJECT_TYPE;
const DEFAULT_PAGE_DATA_LIMIT = _const.DEFAULT_PAGE_DATA_LIMIT;
const DEFAULT_ROW_NAME = _const.DEFAULT_ROW_NAME;

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
    // // Fix:
    // if (!this.parentAssociation) {
    //   this.staticOptions.size = DEFAULT_PAGE_DATA_LIMIT;
    // }
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
    return !this.parentAssociation ? DEFAULT_ROW_NAME : '';
  }

  getRawFields() {
    return '*';
  }

  getSource(parentUseGroup) {
    return `FROM ${this.getTableName()} ${this.getAssociation(parentUseGroup)}`;
  }

  // Will render the respective associations joins inside each node of the query.
  getAssociation(parentUseGroup = false) {

    let associations = this.parentAssociation;

    if (!associations) {
      return '';
    }

    // Transform to array (in some cases the association is already a list of associations).
    associations = _.toArray(associations);

    return associations.map((association, index, self) => {
      const lastAssociation = (index === self.length - 1);
      const joinType = association.resolveJoinType();
      const useFK = !!association.foreignTable && !!association.foreignKey;
      const {
        sourceTable,
        sourceKey,
        sourceHash,
        targetTable,
        targetKey,
        targetHash,
        foreignTable,
        foreignKey,
        useTargetKey,
        useSourceKey,
        associationType,
      } = association;

      const lastNodeHash = /^belongs/.test(associationType) ? targetHash : sourceHash;

      if (parentUseGroup) {
        // When parent node have groupBy option defined in the query schema it
        // will use the json_each builtin SQLite function to resolve the relation
        // between this node ids and the previous grouped ids.
        // return `/* begin breakpoint #1 */, json_each(${sourceHash}.id_${targetKey}) WHERE ${targetTable}.${targetKey}=json_each.value /* end breakpoint #1 */`;
        
        return `/* begin breakpoint #1 */, json_each(${lastNodeHash}.id_${sourceKey}) WHERE ${sourceTable}.${sourceKey}=json_each.value /* end breakpoint #1 */`;
      } else if (!lastAssociation) {
        if (useFK) {
          return `/* begin breakpoint #2 */ ${joinType} JOIN ${foreignTable} ON ${foreignTable}.${foreignKey}=${sourceHash}.${foreignKey}
            ${joinType} JOIN ${targetTable} ON ${targetTable}.${targetKey}=${foreignTable}.${targetKey} /* end breakpoint #2 */`;
        } else {
          return `/* begin breakpoint #3 */ ${joinType} JOIN ${targetTable} ON ${targetTable}.${useTargetKey || targetKey}=${sourceHash}.${useSourceKey || sourceKey} /* end breakpoint #3 */`;
        }
      } else {
        // When not first association from the array means that this association
        // represents the final relation between the list of tables. In that case,
        // use the 'where' clause to join the tables.
        if (useFK) {
          return `/* begin breakpoint #4 (missing) */ /* end breakpoint #4 (missing) */`;
        } else {
          const canUseLastNodeHash = !index;
          return `/* begin breakpoint #5 */ WHERE ${targetTable}.${targetKey}=${canUseLastNodeHash ? lastNodeHash : sourceTable}.${useSourceKey || targetKey} /* end breakpoint #5 */`;
        }
      }
    }).join(' ');
  }

  // This join will be rendered in the root of the query (where we fetch the root
  // collection schema ids).
  getJoin(hasConditionClauses) {

    let associations = this.parentAssociation;

    if (!associations) {
      return '';
    }

    associations = _.toArray(associations);

    return associations.map(association => {
      const joinType = association.resolveJoinType();
      const {
        sourceTable,
        sourceKey,
        useSourceKey,
        sourceHash,
        targetTable,
        targetKey,
        useTargetKey,
        targetHash,
        foreignTable,
        foreignKey,
        associationType,
      } = association;

      // Left join(s) or when there is nothing to filter from the actual node
      // will return empty strings as it do not need to be rendered in the root
      // collection filter id clause. It would make the query a little bit slower.
      // Quick Fix: Ignore join when it is a belongs association.
      // Gererally in that cases the asssociation have already been rendered
      // by the parent/association that have the "has" association type.
      if (!hasConditionClauses || /^left/i.test(joinType) || /^belongs/.test(associationType)) {
        return ``;
        // return `/* begin breakpoint #8 (empty) */ /* end breakpoint #8 (empty) */`;
      } else if (!!foreignTable && !!foreignKey) {
        return `/* begin breakpoint #6 */ ${joinType} JOIN ${foreignTable} ON ${foreignTable}.${foreignKey}=${sourceTable}.${foreignKey} ${joinType} JOIN ${targetTable} ON ${targetTable}.${targetKey}=${foreignTable}.${targetKey} /* end breakpoint #6 */`;
      } else {
        return `/* begin breakpoint #7 */ ${joinType} JOIN ${targetTable} ON ${targetTable}.${useTargetKey || targetKey}=${sourceTable}.${useSourceKey || sourceKey} /* end breakpoint #7 */`;
      }
    }).join(' ');
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
      return (!self.parentAssociation && page && size) ? ' OFFSET '.concat(((page - 1) * size)) : '';
    }

    function resolveGroupBy(gp) {
      if (!gp || !gp.length) return '';
      return ' GROUP BY ' + gp.map(propName => {
        const prop = self.getSchemaPropertyConfig(propName);
        if (!prop) {
          throw new Error(`Undefined "${propName}" property configuration on "${self.name}" schema for grouping.`);
        }
        return prop.alias || prop.name;
      }).map(prop => self.getTableName().concat('.').concat(prop));
    }

    function resolveOrderBy(order) {
      if (!order || !order.length) return '';
      return ' ORDER BY ' + order.map(propName => {
        const prop = self.getSchemaPropertyConfig(propName);
        if (!prop) {
          throw new Error(`Undefined "${propName}" property configuration on "${self.name}" schema for ordering.`);
        }
        return prop.alias || prop.name;
      }).map(prop => self.getTableName().concat('.').concat(prop));
    }

    function resolveLimit(size) {
      const staticSize = self.staticOptions.size;
      if (self.parentAssociation && staticSize) {
        return `LIMIT ${staticSize}`;
      } else if (self.parentAssociation) {
        return ``;
      } else if (size) {
        return `LIMIT ${size}`;
      } else {
        return `LIMIT ${DEFAULT_PAGE_DATA_LIMIT}`;
      }
    }

    const where = resolvedOptions,
          group = _.toArray(this.staticOptions.groupBy),
          order = _.toArray(this.staticOptions.orderBy),
          page  = options.page || this.staticOptions.page,
          size  = options.size || this.staticOptions.size;

    const clauses = {
      where:  resolveWhere(resolvedOptions),
      group:  resolveGroupBy(group),
      order:  resolveOrderBy(order),
      limit:  resolveLimit(options.size),
      offset: resolveOffset(page, size),
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

    const definedOptionKeys = _.keys(options).filter(optionName => !!def.hasOwnProperty(optionName));

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
        case '|':
          return ``;
        case '&':
          return ``;
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