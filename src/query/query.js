const isString = require('lodash/isString');
const formatQuery = require('../utils/query');
const Graph = require('../graph/graph');

const removeDuplicatedLines = text => text
  .replace(/$\n\s{1,}ON\s/gm, ' ON ')
  .replace(/^\s{1,}$\n/gm, '')
  .replace(/^(.*)(\r?\n\1)+$/gm, '$1');

// In some cases there could be necessary table alias
// strings preceeding some reserved keywords.
const removeUnecessaryTableAlias = text => text.replace(/\w+\.(max|min)/g, '$1');

const createGraph = structure => new Graph(structure);

class Query {
  constructor(opts = {}) {
    const {
      name: queryName,
      type: queryType,
    } = opts;
    // 
    delete opts.name;
    delete opts.type;
    // 
    if (!isString(queryName) || /^\s{0,}$/.test(queryName)) {
      throw new Error('Query must have a unique name. The name is missing or is not a string.');
    }
    this.name = queryName;
    this.type = queryType;
    this.graph = createGraph(opts);
  }

  resolve(...args) {
    const { graph, type } = this;
    const [options] = args;
    const resolverName = type === 'count' ? 'rootCount' : undefined;
    let resolvedQuery = graph.resolveGraph(options, resolverName);
    resolvedQuery = removeDuplicatedLines(resolvedQuery);
    resolvedQuery = formatQuery(resolvedQuery);
    resolvedQuery = removeUnecessaryTableAlias(resolvedQuery);
    return resolvedQuery;
  }

  getSchemaByAliasFromGraph(alias) {
    const { graph } = this;
    return graph.getNodeSchemaByAlias(alias);
  }

  // Search for all htm arrays defined inside the graph nodes.
  getFiltersWithHTMSupportFromGraph() {
    const { graph } = this;
    let filters = [];
    graph.walk((node) => {
      const schema = node.getValue();
      const filtersWithHTMSupport = schema.getFiltersWithHTMSupport();
      if (filtersWithHTMSupport && filtersWithHTMSupport.length) {
        filters = filters.concat(filtersWithHTMSupport);
      }
    });
    return filters;
  }
}

module.exports = Query;
