const parseResponseRowObject = require('./parse-response-row-object');

const parseResponseRows = (rows) => {
  const parsedRows = rows.map(row => parseResponseRowObject(row));
  return {
    rows: parsedRows,
    count: parsedRows.length,
  };
};

module.exports = parseResponseRows;
