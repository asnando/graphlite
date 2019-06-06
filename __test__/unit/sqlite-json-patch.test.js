const applyPatch = require('../../src/resolvers/sqlite/apply-patch');

const countPatches = str => (str.match(/json_patch\(/g).length);

describe('apply SQLite json_patch', () => {
  it('should apply patch when nodes size equals to 1', () => {
    const patched = applyPatch([1]);
    expect(countPatches(patched)).toBe(1);
  });

  it('should apply patch when nodes size equals to 2', () => {
    const patched = applyPatch([1, 2]);
    expect(countPatches(patched)).toBe(1);
  });

  it('should apply patch when nodes size equals to 5', () => {
    const patched = applyPatch([1, 2, 3, 4, 5]);
    expect(countPatches(patched)).toBe(6);
  });
});
