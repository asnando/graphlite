const _ = require('../utils');
const debug = require('../debugger');

const _const = require('../constants');
const {
  DEFAULT_OBJECT_TYPE,
  DEFAULT_PAGE_DATA_LIMIT,
  DEFAULT_ROW_NAME,
} = _const;

// The QueryNode represents the real value of a node
// inside the graph of the defined query. It is responsible
// to resolve each part of the query for that specific node.
class QueryNode {

  constructor(opts = {}) {
    _.xtend(this, {
      name: opts.name,
      alias: opts.alias,
      hash: opts.hash,
      // properties: opts.properties,
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
      definedOptions: _.defaults(opts.definedOptions, {}),
      // Represents raw SQL queries to use as filters (declared as array).
      rawOptions: _.defaults(opts.rawOptions, []),
      // Static values defined for [size, orderBy, groupBy, page]
      // inside the query graph.
      staticOptions: {
        page: opts.staticOptions.page,
        size: opts.staticOptions.size,
        orderBy: opts.staticOptions.orderBy,
        groupBy: opts.staticOptions.groupBy,
      },
      // Object containing the filter(s) that tells which rows
      // must be displayed or not. For example, when you want to
      // not display the products having some type of column value.
      displayOptions: _.defaults(opts.shows, {}),
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
    return !this.parentAssociation ? DEFAULT_ROW_NAME : '';
  }

  getRawFields() {
    return '*';
  }

  getSource(parentUseGroup) {
    // When association is defined and it have size equals to one, it should
    // ignore the table name. This step support the directly 'join(s)' over the nested
    // nodes of the query.
    const association = this.parentAssociation;
    if (association && !parentUseGroup && (_.isObject(association) || association.length === 1)) {
      return `FROM ${this.getAssociation(parentUseGroup)}`;
    } 
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

      // Update: Nested associations with size equals to one are now joinned within the respective
      // tables directly(without using the 'where' clause);
      if (self.length === 1 && !parentUseGroup) {
        return `/* begin breakpoint #8 */ (SELECT ${sourceHash}.${useSourceKey || sourceKey}) AS ${sourceHash} ${joinType} JOIN ${targetTable} ${targetHash} ON ${targetHash}.${useTargetKey || targetKey}=${sourceHash}.${useSourceKey || sourceKey} /* end breakpoint #8 */`;
      } else if (parentUseGroup) {
        // When parent node have groupBy option defined in the query schema it
        // will use the json_each builtin SQLite function to resolve the relation
        // between this node ids and the previous grouped ids.
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
      } else if (!!foreignTable && !!foreignKey) {
        return `/* begin breakpoint #6 */ ${joinType} JOIN ${foreignTable} ON ${foreignTable}.${foreignKey}=${sourceTable}.${foreignKey} ${joinType} JOIN ${targetTable} ON ${targetTable}.${targetKey}=${foreignTable}.${targetKey} /* end breakpoint #6 */`;
      } else {
        return `/* begin breakpoint #7 */ ${joinType} JOIN ${targetTable} ON ${targetTable}.${useTargetKey || targetKey}=${sourceTable}.${useSourceKey || sourceKey} /* end breakpoint #7 */`;
      }
    }).join(' ');
  }

  getShowOptions(options) {
    options = this.resolveFilterClauses(this.displayOptions, options);
    return !options.length ? '' : `AND ${options.join(' AND ')}`;
  }

  // options represents the options values object that
  // will render the 'where' clauses of the query.
  // rendersOnly will restrict which type of conditions strings
  // must be returned by this function.
  getOptions(options = {}, rendersOnly = []) {

    const self = this;
    const { staticOptions, rawOptions, definedOptions } = this;
    const optionsValues = _.copy(options);
    const hasAssociation = !!this.parentAssociation;
    const tableName = this.tableName;

    if (rendersOnly.length) {
      // Fix: Translate some render keys to a new name schema.
      rendersOnly = rendersOnly.map(t => {
        switch (t) {
          case 'order':
            return 'orderBy';
          case 'group':
            return 'groupBy';
          default:
            return t;
        };
      });
    }

    const whereResolver = (def, values, raw) => {
      return self.resolveFilterClauses(def, values, raw);
    }

    const limitResolver = (size) => {
      return hasAssociation ? `` : `LIMIT ${size}`;
    }

    const offsetResolver = (page, pageSize) => {
      return (!hasAssociation && page && pageSize)
        ? `OFFSET ${((page - 1) * pageSize)}` : ``;
    }

    const groupByResolver = (g = []) => {
      return !g.length ? `` : `GROUP BY ` + g.map(propName => {
        return self.getSchemaPropertyConfig(propName);
      }).map(prop => {
        return prop.alias || prop.name;
      }).map(propName => {
        return `${tableName}.${propName}`;
      }).join(`,`);
    }

    const orderByResolver = (o = []) => {
      return !o.length ? `` : `ORDER BY ` + o.map(propName => {
        return self.getSchemaPropertyConfig(propName);
      }).map(prop => {
        return prop.alias || prop.name;
      }).map(propName => {
        return `${tableName}.${propName}`;
      }).join(`,`);
    }

    // Merge static options from the query schema and the ones
    // received by the find(s) function.
    const extraOptions = {
      page: options.page || staticOptions.page || 1,
      size: options.size || staticOptions.size || DEFAULT_PAGE_DATA_LIMIT,
      orderBy: _.toArray(options.orderBy || staticOptions.orderBy),
      groupBy: _.toArray(options.groupBy || staticOptions.groupBy)
    };

    // Remove extra options properties from the options object values.
    delete optionsValues.page;
    delete optionsValues.size;

    const resolved = {
      where: whereResolver(definedOptions, optionsValues, rawOptions),
      groupBy: groupByResolver(extraOptions.groupBy),
      orderBy: orderByResolver(extraOptions.orderBy),
      limit: limitResolver(extraOptions.size),
      offset: offsetResolver(extraOptions.page, extraOptions.size),
    };

    let keysToRender = _.keys(resolved);

    // Remove keys that must not need be returned.
    if (rendersOnly.length) {
      keysToRender = keysToRender.filter(k => rendersOnly.includes(k));
    }
    return keysToRender.map(k => resolved[k]).join(` `);
  }

  resolveFilterClauses(def, values, rawOptions = []) {

    const self = this;
    const tableName = this.tableName;

    const translateFilterWithValue = (filter, value) => {
      const operator = /^\W/.test(filter) ? filter.match(/^\W+/)[0] : '=';
      const prop = self.getSchemaPropertyConfig(filter.replace(/^\W+/, ''));
      const propName = prop.alias || prop.name;
      return replaceValueIntoOperator(operator, value, `${tableName}.${propName}`, prop.type);
    }

    // Translate all the matches(${propName}) within the real
    // columns names in the 'TABLENAME.COLNAME' schema inside the query.
    const translateRawQuery = (query) => {
      _.toArray(query.match(/\$\{(\w+)\}/g)).map(t => {
        return t.replace(/(^\$\{)|(\}$)/g, '');
      }).forEach(propName => {
        const rgxp = new RegExp(`\\$\\{${propName}\\}`);
        let prop = self.getSchemaPropertyConfig(propName);
        prop = `${tableName}.${prop.alias || prop.name}`;
        query = query.replace(rgxp, prop);
      });
      return query;
    }

    const resolvedRawOptions = rawOptions.map(q => translateRawQuery(q));

    // Remove from defined options array all the missing keys
    // from the options value object.
    const resolvedDefinedOptions = _.keys(def)
      .filter(k => _.keys(values).includes(k))
      .map(filterName => {
        return translateFilterWithValue(def[filterName], values[filterName]);
      });

    const resolvedOptions = [
      ...resolvedRawOptions,
      ...resolvedDefinedOptions
    ];

    return !resolvedOptions.length ? `` : `WHERE ` + resolvedOptions.join(` AND `);
  }

  getSchemaPropertyConfig(propName) {
    const props = this.schemaProperties;
    const prop = /^id$/.test(propName)
      ? props.find(p => p.type === 'primaryKey')
      : props.find(p => p.name === propName);
    if (!prop) throw new Error(`Undefined "${propName}" property configuration on "${this.name}" schema.`);
    return prop;
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

function replaceValueIntoOperator(operator, value, field, type) {
  switch (operator) {
    case '=':
      return /number|primaryKey/.test(type) ? `${field}=${value}` : `${field}=${_.quote(value)}`;
    case '<>':
      return /number|primaryKey/.test(type) ? `${field}<>${value}` : `${field}<>${_.quote(value)}`;
    case '>':
      return `${field}>${value}`;
    case '<':
      return `${field}<${value}`;
    case '%':
      return `${field} LIKE ${_.quote('%' + value + '%')}`;
    case '#':
      return `${field} GLOB ${_.quote(_.glob(value))}`;
    case '|':
      return ``;
    case '&':
      return ``;
    default:
      return '';
  };
}