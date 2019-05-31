const graphlite = require('../../src');
const sqlite = require('sqlite-storage');
const useSchemas = require('../config/schemas.config');
const useQueries = require('../config/queries.config');
const useAssociations = require('../config/useAssociations');
const useLocale = require('../config/locale.config');
const databases = require('../config/databases.config');

let db, graph;

beforeAll(async () => {
  // create database instances
  db = new sqlite({
    databases,
  });
  // create graphlite instance
  graph = new graphlite({
    connection: db.executeQuery.bind(db),
    ...useLocale,
    schemas: useSchemas,
    queries: useQueries,
    associations: useAssociations,
  });
  // connect databases list
  await db.connect();
});

afterAll(async () => {
  await db.close();
});

describe('graphlite', () => {

  it('should return 100 rows from database table ordered by description', async() => {
    const options = {};
    const extraOptions = { size: 100, page: 1 };
    const data = await graph.findAll('lista-produtos', options, extraOptions);
    const { count } = data;
    expect(count).toBe(100);
  });

  it('should return one product with the 10785 id', async() => {
    const options = { id: 10785 };
    const extraOptions = {};
    const data = await graph.findAll('produto', options, extraOptions);
    const { rows } = data;
    const [product] = rows;
    expect(product.id).toBe(10785);
  });

});
