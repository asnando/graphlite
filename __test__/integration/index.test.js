const graphlite = require('../../src');
const sqlite = require('sqlite-storage');
const path = require('path');

const databasePath = path.resolve(__dirname, '..', 'databases');
const databases = [
  {
    name: 'data',
    path: path.join(databasePath, 'test.db'),
  },
];

let db = null;

const graph = new graphlite({

});

beforeAll(async () => {
  db = new sqlite({
    databases,
  });
  await db.connect();
});

afterAll(async () => {
  await db.close();
});

describe('graphlite', () => {
  it('should return 2 when 1 + 1', () => {
    const value = sum(1,1);
    expect(value).toBe(2);
  });
});

const sum = (a, b) => (a + b);
