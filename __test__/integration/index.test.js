describe('graphlite', () => {
  it('should return 2 when 1 + 1', () => {
    const value = sum(1,1);
    expect(value).toBe(2);
  });
});

const sum = (a, b) => (a + b);
