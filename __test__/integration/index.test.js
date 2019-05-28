const graphlite = require('../../src');
const sqlite = require('sqlite-storage');
const path = require('path');

let db, graph;

const schema = (schemaName) => require(path.resolve(__dirname, '..', 'schemas', schemaName));
const query = (queryName) => require(path.resolve(__dirname, '..', 'queries', queryName));
const useAssociations = require('../useAssociations');

const databasePath = path.resolve(__dirname, '..', 'databases');
const databases = [
  {
    name: 'data',
    path: path.join(databasePath, 'test.db'),
  },
];

const defaultLanguage = 'pt-br';
const locales = {
  'pt-br': {
    usePreffix: null,
  },
  en: {
    usePreffix: 'E',
  },
};

const schemas = [
  schema('aplicacao'),
  schema('fabricante'),
  schema('grupo'),
  schema('imagem'),
  schema('montadora'),
  schema('produto'),
  schema('referencia'),
  schema('subgrupo'),
  schema('linhaProduto'),
];

const queries = [
  query('produto'),
];

beforeAll(async () => {
  // create database instances
  db = new sqlite({
    databases,
  });
  // create graphlite instance
  graph = new graphlite({
    connection: db.executeQuery.bind(db),
    locales,
    defaultLanguage,
    schemas,
    queries,
    associations: useAssociations,
  });
  // connect databases list
  await db.connect();
});

afterAll(async () => {
  await db.close();
});

describe('graphlite', () => {
  it('should return all products from database', async () => {
    const data = await graph.findAll('produto');
    const rows = data.rows;
    expect(rows.length).toBe(6674);
  });
});
