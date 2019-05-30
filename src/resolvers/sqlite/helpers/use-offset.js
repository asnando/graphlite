const useOffset = (size, page) => ((size && page) ? `OFFSET ${(page - 1) * size}` : '');

module.exports = useOffset;
