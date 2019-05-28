const hashCode = () => {
  const hash = Math.random().toString(36).substring(2, 15)
    + Math.random().toString(36).substring(2, 15);
  return /^\d/.test(hash) ? hashCode() : hash;
};

module.exports = hashCode;
