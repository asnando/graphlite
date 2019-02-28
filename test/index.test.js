const connectionProvider = require('./connection-provider');
const GraphLite = require('../src');

const connection = new connectionProvider('./test/databases/test.db');

const graphlite = new GraphLite({ connection });

const products = graphlite.defineSchema('product', {
  tableName: 'PRODUTO',
  properties: {
    CodigoProduto: {
      type: 'primaryKey'
    },
    DescricaoProduto: 'string',
    Numero: {
      type: 'string',
      alias: 'NumeroProduto'
    },
    FotoProduto: {
      resolve: ['ArquivoFotoProduto', 'ArquivoFotoProduto2']
    },
    preco: {
      alias: 'PrecoProduto',
      parse: function(value) {
        return value || 1;
      }
    }
  }
});

const automakers = graphlite.defineSchema({
  name: 'automaker',
  tableName: 'FABRICANTE',
  properties: {
    CodigoFabricante: 'primaryKey',
    DescricaoFabricante: 'string'
  }
});

const aplications = graphlite.defineSchema({
  name: 'aplication',
  tableName: 'APLICACAO',
  properties: {
    CodigoAplicacao: 'primaryKey',
    DescricaoAplicacao: 'string',
    complemento: {
      join: ['ComplementoAplicacao2', 'ComplementoAplicacao']
    }
  }
});

products.hasMany(automakers);
automakers.belongsTo(products);
automakers.hasOne(aplications);
aplications.belongsTo(automakers);

const test = graphlite.defineQuery('test', {
  product: {
    properties: '*',
    automaker: {
      properties: '*',
      aplication: '*'
    }
  }
});

graphlite.test('test');

// sourceKey, targetKey
// sourceTable, targetTable