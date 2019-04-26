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
};