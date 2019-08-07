const queryList = require('../jar/query-list');
const parseResponseRowObject = require('./parse-response-row-object');

const parseResponseRows = (rows, queryName, queryOptions) => {
  // Query can receive a list of filters names or static strings as query
  // options to work with the htm functionality.
  const { htm: staticHtm = [] } = queryOptions;
  const query = queryList.getQuery(queryName);
  // Detect all the htm filters defined in the graph.
  let htm = query.getFiltersWithHTMSupportFromGraph();
  // For each detected filter tries to fetch get the inputed value
  // from the query options.
  htm = htm
    .filter(filterName => queryOptions[filterName])
    .map(filterName => queryOptions[filterName])
    .concat(staticHtm);
  // Pass down the resolved htm filter names and static strings(from query options).
  const parsedRows = rows.map(row => parseResponseRowObject(row, { htm }));
  return {
    rows: parsedRows,
    count: parsedRows.length,
  };
};

module.exports = parseResponseRows;
