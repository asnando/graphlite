const _ = require('../utils');
const debug = require('../debugger');

const _const = require('../constants');
const {
  DEFAULT_OBJECT_TYPE,
  DEFAULT_PAGE_DATA_LIMIT,
  DEFAULT_ROW_NAME,
  GRAPHLITE_COLUMN_DATA_TYPES,
  PRIMARY_KEY_DATA_TYPE,
  NUMERIC_DATA_TYPE,
  STRING_DATA_TYPE,
  BOOLEAN_DATA_TYPE,
  INTEGER_DATA_TYPE,
  FLOAT_DATA_TYPE,
} = _const;

// The QueryNode represents the real value of a node
// inside the graph of the defined query. It is responsible
// to resolve each part of the query for that specific node.
class QueryNode {

  constructor(opts = {}, providers = {}) {
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
      // Alias name to use on nested objects when type array.
      showAs: opts.showAs,
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
      localeProvider: providers.localeProvider,
      filterProvider: providers.filterProvider
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

  getPropertyNameInTable(propName) {
    const props = this.definedProperties;
    let prop, propResolvedName;
    if (/^_id$/.test(propName)) {
      prop = props.find(prop => prop.type === PRIMARY_KEY_DATA_TYPE);
    } else {
      prop = props.find(prop => prop.name === propName);
    }
    
    propResolvedName = prop.alias || prop.name;

    if (prop.useLocale) {
      const locale = this.localeProvider();
      if (locale.useSuffix) {
        propResolvedName += locale.useSuffix;
      }
    }

    return propResolvedName;
  }

  resolvePropertyAliasName(prop) {
    return prop.type === PRIMARY_KEY_DATA_TYPE ? '_id' : prop.name;
  }

  // Returns format: 'fieldName', tableAlias.(fieldAlias || fieldName)
  getFieldsAsJson() {
    const tableAlias = this.getTableAlias();
    const hasAssociation = !!this.parentAssociation;
    const props = this.definedProperties;
  
    return props.filter(prop => {
      return !hasAssociation || prop.type !== PRIMARY_KEY_DATA_TYPE;
    }).map(prop => {
      
      let propDisplayName = this.resolvePropertyAliasName(prop);
      let propTableName = this.getPropertyNameInTable(propDisplayName);
  
      if (prop.resolver) {
        propTableName = '(CASE' + prop.resolver.map(name => ` WHEN ${tableAlias}.${name} IS NOT NULL THEN ${tableAlias}.${name}`).join(' ') + ' END)';
      } else if (prop.join) {
        propTableName = prop.join.join(' || ');
      } else {
        propTableName = tableAlias.concat('.').concat(propTableName);
      }
  
      switch (prop.type) {
        case BOOLEAN_DATA_TYPE:
          propTableName = `(CASE WHEN ${propTableName} IS NOT NULL AND ${propTableName}<>0 THEN 1 ELSE 0 END)`;
          break;
        case INTEGER_DATA_TYPE:
          propTableName = `cast(${propTableName} as integer)`;
          break;
        case NUMERIC_DATA_TYPE:
        case FLOAT_DATA_TYPE:
          propTableName = `cast(${propTableName} as real)`;
          break;
      };
  
      return [
        _.quote(propDisplayName),
        propTableName
      ].join(',');
  
    }).join(',');
  }

  getResponseObjectName() {
    return !this.parentAssociation ? DEFAULT_ROW_NAME : '';
  }

  getRawFields() {
    return !this.parentAssociation ? '*' : this.definedProperties
      .filter(prop => prop.type !== PRIMARY_KEY_DATA_TYPE)
      .map(prop => prop.alias || prop.name).join(',');
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
    // Fix: Remove the 'where' keyboard from the resolved display options query
    // as it generally are located inside nested collections and must not repeat.
    options = options.replace(/^WHERE/, 'AND');
    return options;
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
      return size ? `LIMIT ${size}` : ``;
    }

    const offsetResolver = (page, pageSize) => {
      return (!hasAssociation && page && pageSize)
        ? `OFFSET ${((page - 1) * pageSize)}` : ``;
    }

    const groupByResolver = (g = []) => {
      return !g.length ? `` : `GROUP BY ` + g.map(propName => {
        return self.getPropertyNameInTable(propName);
      }).map(propName => {
        return `${tableName}.${propName}`;
      }).join(`,`);
    }

    function whichOrderByOperator(ob) {
      const opr = /^(\>|\<)/.test(ob) ? ob.match(/^\W/)[0] : null;
      return !opr ? null : /^\>/.test(opr) ? 'asc' : /^\</.test(opr) ? 'desc' : null;
    }

    const orderByResolver = (o = []) => {
      return !o.length ? `` : `ORDER BY ` + o.filter(propName => {
        if (!self.haveSchemaPropertyConfig(propName) && !optionsValues[propName]) {
          return false;
        }
        return true;
      }).map(propName => {
        if (self.haveSchemaPropertyConfig(propName)) {
          // Normal property.
          const orderType = whichOrderByOperator(propName);
          // Remove order by operator from prop name.
          propName = propName.replace(/^\W/, '');
          // Resolve the column name of property.
          propName = self.getPropertyNameInTable(propName);
          return orderType
            ? `${tableName}.${propName} ${orderType}`
            : `${tableName}.${propName}`;
        } else if (self.haveGroupByOption()) {
          // Prop represents a query filter. We will use the
          // filterProvider to find which filter it refers to.
          const filter = self.filterProvider(propName);
          const filterName = filter.name;
          const prop = filter.refersTo;
          const propType = prop.type;
          const resolvedPropName = prop.alias || prop.name;
          const value = optionsValues[filterName];
          const operator = filter.filter.match(/^\W+/)[0];
          const resolvedFilter = replaceValueIntoOperator(operator, 'json_each.value', value, propType);
          return `(select min(case when ${resolvedFilter} then 0 else 1 end)
            from json_each(json_group_array(${resolvedPropName})))`;
        } else {
          return `1=1`;
        }
      }).join(`,`);
    }

    // Merge static options from the query schema and the ones
    // received by the find(s) function.
    const extraOptions = {
      page: options.page || staticOptions.page || 1,
      size: hasAssociation ? staticOptions.size : (options.size || staticOptions.size || DEFAULT_PAGE_DATA_LIMIT),
      orderBy: _.toArray(!hasAssociation ? (options.orderBy || staticOptions.orderBy) : staticOptions.orderBy),
      groupBy: _.toArray(staticOptions.groupBy)
    };

    // Remove extra options properties from the options object values.
    delete optionsValues.page;
    delete optionsValues.size;
    delete optionsValues.orderBy;

    const resolved = {
      where: whereResolver(definedOptions, optionsValues, rawOptions),
      groupBy: groupByResolver(extraOptions.groupBy),
      orderBy: orderByResolver(extraOptions.orderBy),
      limit: limitResolver(extraOptions.size),
      offset: offsetResolver(extraOptions.page, extraOptions.size),
    };

    // 
    if (hasAssociation && !/^$/.test(resolved.where)) {
      if (!/^$/.test(resolved.orderBy)) {
        resolved.orderBy += resolved.where
          .replace(/^WHERE/, ',')
          .split(/\b(AND|OR)\b/)
          .map(ob => `${ob} DESC`)
          .join(',');
      } else {
        resolved.orderBy = resolved.where
          .replace(/^WHERE/, 'ORDER BY')
          .split(/\b(AND|OR)\b/)
          .map(ob => `${ob} DESC`)
          .join(',');
      }
    }

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
      const propName = self.getPropertyNameInTable(prop.name);
      return replaceValueIntoOperator(operator, `${tableName}.${propName}`, value, prop.type);
    }

    // Translate all the matches(${propName}) within the real
    // columns names in the 'TABLENAME.COLNAME' schema inside the query.
    const translateRawQuery = (query) => {
      _.toArray(query.match(/\$\{(\w+)\}/g)).map(t => {
        return t.replace(/(^\$\{)|(\}$)/g, '');
      }).forEach(propName => {
        const rgxp = new RegExp(`\\$\\{${propName}\\}`);
        query = query.replace(rgxp, self.getPropertyNameInTable(propName));
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

  haveSchemaPropertyConfig(propName) {
    return !!this.schemaProperties.find(prop => propName === prop.name);
  }

  getSchemaPropertyConfig(propName) {
    const props = this.schemaProperties;
    const prop = /^id$/.test(propName)
      ? props.find(p => p.type === PRIMARY_KEY_DATA_TYPE)
      : props.find(p => p.name === propName);
    if (!prop) throw new Error(`Undefined "${propName}" property configuration on "${this.name}" schema.`);
    return prop;
  }

  getAssociationName() {
    const name = this.showAs || this.name;
    return _.quote(name);
  }

  getDistinctPrimaryKey() {
    return `DISTINCT ${this.getTableName()}.${this.getPrimaryKey()}`;
  }

  haveGroupByOption() {
    return !!this.staticOptions.groupBy;
  }

}

module.exports = QueryNode;

function replaceValueIntoOperator(operator, field, value, type) {
  const isNumeric = new RegExp(`${NUMERIC_DATA_TYPE}|${PRIMARY_KEY_DATA_TYPE}|${FLOAT_DATA_TYPE}|${INTEGER_DATA_TYPE}`).test(type);
  switch (operator) {
    case '=':
      return isNumeric ? `${field}=${value}` : `${field}=${_.quote(value)}`;
    case '<>':
      return isNumeric ? `${field}<>${value}` : `${field}<>${_.quote(value)}`;
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