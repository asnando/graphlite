const useLimit = require('./use-limit');
const useOffset = require('./use-offset');
const useWhere = require('./use-where');
const useOrderBy = require('./use-order-by');
const useGroupBy = require('./use-group-by');
const debug = require('../../../debug');
const constants = require('../../../constants');

const {
  DEFAULT_PAGE_SIZE,
} = constants;

const SQLiteGraphNodeOptionsResolver = (schema, queryOptions, node, useOnly = []) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const isRoot = node.isRoot();

  const resolvedExtraOptions = {};
  // 'size' and 'page' are options that must not be rendered inside nested nodes of graph.
  // It can be only rendered if it is statically defined in the query schema.
  if (isRoot) {
    resolvedExtraOptions.size = queryOptions.size || schemaDefinedOptions.size || DEFAULT_PAGE_SIZE;
    resolvedExtraOptions.page = queryOptions.page || schemaDefinedOptions.page || 1;
  } else {
    resolvedExtraOptions.size = schemaDefinedOptions.size;
    resolvedExtraOptions.page = schemaDefinedOptions.page;
  }

  // merge query options and query static defined options.
  const mergedOptions = {
    ...schemaDefinedOptions,
    ...queryOptions,
    ...resolvedExtraOptions,
  };

  const { size, page } = mergedOptions;

  // Keep the order.
  const types = [
    'where',
    'groupBy',
    'orderBy',
    'limit',
    'offset',
  ];

  return types.filter(type => (!useOnly.length ? true : useOnly.includes(type))).map((type) => {
    switch (type) {
      case 'limit':
        return useLimit(size);
      case 'offset':
        return useOffset(size, page);
      case 'orderBy':
        return useOrderBy(schema, mergedOptions);
      case 'where':
        return useWhere(schema, mergedOptions);
      case 'groupBy':
        return useGroupBy(schema, mergedOptions);
      default:
        return '';
    }
  }).join(' ');
};

module.exports = SQLiteGraphNodeOptionsResolver;
