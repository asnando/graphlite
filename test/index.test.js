const path = require('path');
const graphlite = require('../src');
const sqliteStorage = require('sqlite-storage');

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

const sqlite = new sqliteStorage({
  databases: [
    {
      name: "data",
      path: path.join(__dirname, 'databases', 'test.db')
    },
    {
      name: "images",
      path: path.join(__dirname, 'databases', 'images'),
      attach: true,
    }
  ]
});

// note: replacement while we do not have mocha installed yet.
const before = (callback) =>  callback();
const after = (callback) => callback();

// before(() => {
//   sqlite.connect().then(() => {
//     console.log('Databases connected!');
//     after(() => {
//       sqlite.close().then(() => {
//         console.log('Databases disconnected!');
//       });
//     });
//   });
// });