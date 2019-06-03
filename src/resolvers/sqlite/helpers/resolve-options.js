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

const SQLiteGraphNodeOptionsResolver = (schema, queryOptions, node) => {
  const schemaDefinedOptions = schema.getDefinedOptions();
  const isRoot = node.isRoot();

  let resolvedExtraOptions = {};
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

  const limit = useLimit(size);
  const offset = useOffset(size, page);
  const orderBy = useOrderBy(schema, mergedOptions);
  const where = useWhere(schema, mergedOptions);
  const groupBy = useGroupBy(schema, mergedOptions);
  return `${where} ${groupBy} ${orderBy} ${limit} ${offset}`;
};

module.exports = SQLiteGraphNodeOptionsResolver;
