// Fallback page number used by the find* methods.
const DEFAULT_OPTIONS_PAGE = 1;
// Size of rows per page.
const DEFAULT_PAGE_DATA_LIMIT = 100;
// The json data from rows are resumed by the key below.
const DEFAULT_ROW_NAME = 'response';
// The default type of association object. This defines if association
// have size one(object) or multiple(array).
const DEFAULT_OBJECT_TYPE = 'object';
// Queries which count the total avaiable data for a specific query
// will resume the data into the object key below.
const DEFAULT_ROW_COUNT_NAME = 'count';
// The response object key where the data rows array will be stored.
const DEFAULT_OBJECT_RESPONSE_NAME = 'rows';
// Default type of join used by the associations.
const DEFAULT_ASSOCIATION_JOIN_TYPE = 'inner';
// The response object key containg a generic count of the rows fetched
// by the actual page.
const DEFAULT_COUNT_OBJECT_RESPONSE_NAME = 'count';
// The response object key containing the total avaiable rows count.
const DEFAULT_TOTAL_COUNT_OBJECT_RESPONSE_NAME = 'total';
// The lib builds the query then call the connection provider method
// with the name below in order to execute the query into the database.
const DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME = 'executeQuery';
// 
const GRAPHLITE_COLUMN_DATA_TYPES = [
  'primaryKey',
  'number',
  'string',
  'boolean',
  'integer',
  'float',
];
const PRIMARY_KEY_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[0];
const NUMERIC_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[1];
const STRING_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[2];
const BOOLEAN_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[3];
const INTEGER_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[4];
const FLOAT_DATA_TYPE = GRAPHLITE_COLUMN_DATA_TYPES[5];

module.exports = {
  DEFAULT_ROW_NAME,
  DEFAULT_OBJECT_TYPE,
  DEFAULT_ROW_COUNT_NAME,
  DEFAULT_PAGE_DATA_LIMIT,
  DEFAULT_OPTIONS_PAGE,
  DEFAULT_OBJECT_RESPONSE_NAME,
  DEFAULT_ASSOCIATION_JOIN_TYPE,
  DEFAULT_COUNT_OBJECT_RESPONSE_NAME,
  DEFAULT_TOTAL_COUNT_OBJECT_RESPONSE_NAME,
  DEFAULT_CONNECTION_PROVIDER_QUERY_RUNNER_NAME,
  GRAPHLITE_COLUMN_DATA_TYPES,
  PRIMARY_KEY_DATA_TYPE,
  NUMERIC_DATA_TYPE,
  STRING_DATA_TYPE,
  BOOLEAN_DATA_TYPE,
  INTEGER_DATA_TYPE,
  FLOAT_DATA_TYPE,
};