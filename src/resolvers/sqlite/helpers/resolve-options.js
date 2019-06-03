const useLimit = require('./use-limit');
const useOffset = require('./use-offset');
const useWhere = require('./use-where');
const useOrderBy = require('./use-order-by');
const useGroupBy = require('./use-group-by');
const debug = require('../../../debug');

const SQLiteGraphNodeOptionsResolver = (schema, options, node) => {
  const schemaDefinedOptions = schema.getDefinedOptions();

  const isRoot = node.isRoot();

  // merge query options and query static defined options.
  const mergedOptions = {
    ...schemaDefinedOptions,
    ...options,
    // 'size' and 'page' are options that must not be rendered inside nested nodes of graph.
    // It can be only rendered if it is statically defined in the query schema.
    ...{
      size: isRoot ? (options.size || schemaDefinedOptions.size) : schemaDefinedOptions.size,
      page: isRoot ? (options.page || schemaDefinedOptions.page) : schemaDefinedOptions.page,
    },
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
