const useLimit = size => (size ? `LIMIT ${size}` : '');

module.exports = useLimit;
