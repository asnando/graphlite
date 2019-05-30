const useLimit = require('./use-limit');
const useOffset = require('./use-offset');
const useWhere = require('./use-where');
const useOrderBy = require('./use-order-by');
const useGroupBy = require('./use-group-by');

const SQLiteGraphNodeOptionsResolver = (schema, options) => {
  const { size, page } = options;
  const limit = useLimit(size);
  const offset = useOffset(size, page);
  const orderBy = useOrderBy(schema, options);
  const where = useWhere(schema, options);
  const groupBy = useGroupBy(schema, options);
  return `${where} ${groupBy} ${orderBy} ${limit} ${offset}`;
};

module.exports = SQLiteGraphNodeOptionsResolver;
