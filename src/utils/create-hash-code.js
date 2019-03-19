module.exports = function createHashCode() {
  let h = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return /^\d/.test(h) ? createHashCode() : h;
}