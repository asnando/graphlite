const debug = require('./utils/debug');
const warn = require('./utils/warn');
const alert = require('./utils/alert');
const  _ = require('./utils/');
const Graph = require('./graph');

class Query {

  constructor(name, graph, schemaProvider) {
    this.name = name;
    this.rawGraph = graph;
    this.schemaProvider = schemaProvider;
    this.graph = this._resolveGraph(this.rawGraph);
  }

  _resolveGraph(graph) {
    let resolvedGraph = new Graph();
    const schemaProvider = this.schemaProvider;
    _.jtree(graph, (node, path) => {
      const isSchemaNode = !/^\$$/.test(path) && !/(?<=\.where)|(properties|\d|where|type|(?<=has)(\w+)|(?<=\_)\w+)$/.test(path);

      if (!isSchemaNode) return;

      const schemaName = path.split('.').pop();

      // Resolves the schema graph
      const schema = schemaProvider(schemaName);
      
      if (!schema) {
        throw new Error(`Could not detect schema configuration for "${schemaName}".`);
      }

      function schemaBelongsToParent() {
        const parent = resolvedGraph.getTailNode().raw();
        return !!schema.belongs.many[parent.name] || !!schema.belongs.one[parent.name];
      }

      function hasRelationWithParent() {
        const parent = resolvedGraph.getTailNode().raw();
        return !!parent.has.many[schema.name] || !!parent.has.one[schema.name];
      }

      function getParentName() {
        return resolvedGraph.getTailNode().raw().name;
      }

      let relationSize;
      
      // Check if this schema have relation with the parent schema.
      if (resolvedGraph.tail && (!schemaBelongsToParent() || !hasRelationWithParent())) {
        throw(`"${schema.name}" is not related to "${getParentName()}"`);
      }

      return resolvedGraph.addNode(schema.hash, {
        ...schema,
        options: {
          where: node.where,
          orderBy: node.orderBy,
          size: node.size,
          page: node.page
        },
        relationSize,
        // 
        resolveTableName: schema._resolveTableName,
        resolveSource: function() {

        },
        resolveProperties: schema._resolveProperties,
        resolveOptions: function() {
          return '';
        }
      }, graphNodeResolver);
    });
    return resolvedGraph;
  }

  build(options = {}) {
    alert(`Building query "${this.name}" with options ${_.jpretty(options)}`);
    this.graph.resolve();
  }

}

function graphNodeResolver(rawNode, node, nextNodes) {

  function objectHasOneKey(object) {
    for (let key in object) {
      if (_.isDef(object[key])) return true;
    }
    return false;
  }

  let query = '';

  const parent      = node.getParent(),
        fields      = rawNode.resolveProperties(),
        objectType  = rawNode.relationSize || 'object',
        options     = rawNode.options;

  query = 'SELECT';

  switch (objectType) {
    case 'object':
      query += ` json_object(${fields})`;
      break;
    case 'array':
      query += ` json_object('${rawNode.name}', json_group_array(json_object(${fields})))`;
      break;
  };

  if (!parent) {
    query += ` FROM ${rawNode.resolveTableName()}`;
  } else {
    // TODO: Resolve relation join(s).
    query += ` FROM `;
  }

  warn('options:', rawNode.resolveOptions());

  nextNodes();
  debug('***');
  alert(query);
  return query;

  // let query;
  // const parentNode = node.parent();
  // const tableName = node.resolveTableName();
  // const props = node.resolveProperties();

  // warn('building', tableName);

  // switch (node.type) {
  //   case 'object':
  //     query = `SELECT json_patch(json_object(${props}), (${nextNodes()}))`;
  //     break;
  //   case 'array':
  //     query = `SELECT json_object(${_.quote(tableName)}, json_group_array(json_patch(json_object(${props}), (${nextNodes()}))))`;
  //     break;
  // };

  // if (parentNode) {
  //   const parentTableName = node.resolveParentTableName(node);
  //   const crossTableName = node.resolveCrossTableName(node);
  //   const primaryKey = 'CodigoAplicacao';
  //   const foreignKey = 'CodigoProduto'
  //   query += ` FROM (SELECT * FROM ${crossTableName} INNER JOIN ${tableName} ON ${tableName}.${primaryKey}=${crossTableName}.${primaryKey} WHERE ${crossTableName}.${foreignKey}=${parentTableName}.${foreignKey}) AS ${tableName}`;
  // } else {
  //   query += ` FROM ${tableName}`;
  // }

  // if (!node.parent()) {
  //   query += ';';
  //   _.pbcopy(query);
  //   debug(query);
  // }
  
  // return query;
}

module.exports = Query;