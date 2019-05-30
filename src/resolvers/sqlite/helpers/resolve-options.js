const useLimit = require('./use-limit');
const useOffset = require('./use-offset');
const useWhere = require('./use-where');
const useOrderBy = require('./use-order-by');
const useGroupBy = require('./use-group-by');
const debug = require('../../../debug');

const SQLiteGraphNodeOptionsResolver = (schema, options) => {
  const schemaDefinedOptions = schema.getDefinedOptions();

  // merge query options and query static defined options.
  const mergedOptions = {
    ...schemaDefinedOptions,
    ...options,
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
