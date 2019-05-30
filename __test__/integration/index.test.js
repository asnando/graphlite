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
  // it('should return 6674 rows from database table', async () => {
  //   const data = await graph.findAll('produto');
  //   const { count } = data;
  //   expect(count).toBe(6674);
  // });

  // it('should return 100 rows from database table ordered by description', async() => {
  //   const options = {};
  //   const extraOptions = { size: 100, page: 1, orderBy: ['descricaoProduto'] };
  //   const data = await graph.findAll('produto', options, extraOptions);
  //   const { count } = data;
  //   expect(count).toBe(100);
  // });

  it('should return one product with the 19260 id', async() => {
    const options = { id: 19260 };
    const extraOptions = {};
    const data = await graph.findAll('produto', options, extraOptions);
    expect(data.count).toBe(1);
  });

});
