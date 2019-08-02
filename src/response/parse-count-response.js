const {
  COUNT_RESPONSE_FIELD_NAME,
} = require('../constants');

const parseCountResponse = (rows) => {
  const [row] = rows;
  return typeof row === 'object' ? row[COUNT_RESPONSE_FIELD_NAME] : 0;
};

module.exports = parseCountResponse;
