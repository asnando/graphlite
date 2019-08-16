const Sqlite = require('sqlite-storage');
const Graphlite = require('../../src');
const useSchemas = require('../config/schemas.config');
const useQueries = require('../config/queries.config');
const useAssociations = require('../config/useAssociations');
const useLocale = require('../config/locale.config');
const databases = require('../config/databases.config');

let db;
let graph;

beforeAll(async () => {
  // create database instances
  db = new Sqlite({
    databases,
  });
  // create graphlite instance
  graph = new Graphlite({
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

const findOne = async (queryName, options = {}) => {
  const data = await graph.findOne(queryName, options);
  return data;
};

const findAll = async (queryName, options = {}) => {
  const data = await graph.findAll(queryName, options);
  return data;
};

describe('graphlite', () => {
  it('should return a list with the first 30 products ordered by description', async () => {
    const options = {
      size: 30,
      page: 1,
    };
    const data = await findAll('lista-produtos', options);
    const { count } = data;
    expect(count).toBe(30);
  });

  it('should return a list with all products groups ordered by order column', async () => {
    const data = await findAll('grupos');
    const { rows } = data;
    const [firstGroup] = rows;
    expect(firstGroup.descricaoGrupo).toBe('JUNTAS');
  });

  it('should return a list of products lines ordered by order column', async () => {
    const data = await findAll('linhas-produtos');
    const { rows } = data;
    const [firstLine] = rows;
    expect(firstLine.descricaoLinhaProduto).toBe('LINHA LEVE');
  });

  it('should return a list with automakers ordered by the order column', async () => {
    const data = await findAll('montadoras');
    const { rows } = data;
    const [firstAutomaker] = rows;
    expect(firstAutomaker.descricaoMontadora).toBe('CHEVROLET');
  });

  it('should return a list of vehicle of the "FIAT" automaker', async () => {
    const data = await findAll('veiculos');
    const { rows } = data;
    const [firstVehicle] = rows;
    expect(firstVehicle.descricaoAplicacao).toBe('100');
  });

  it('should return information about the product with "10694" id', async () => {
    const options = {
      id: 10694,
    };
    const data = await findOne('produto', options);
    const { rows } = data;
    const [product] = rows;
    expect(product.id).toBe(10694);
  });
});
