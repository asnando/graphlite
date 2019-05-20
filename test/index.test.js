const path = require('path');
const graphlite = require('../src');

const schema = (schemaName) => {
  return require(path.resolve(__dirname, 'schemas', schemaName));
}

const query = (queryName) => {
  return require(path.resolve(__dirname, 'queries', queryName));
}

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
  // query('listaProdutos'),
  query('produto'),
  // query('linhasProdutos'),
  // query('montadoras'),
  // query('veiculos'),
  // query('grupos'),
];

const graph = new graphlite({
  schemas,
  queries,
});
