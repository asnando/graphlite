const connectionProvider = require('./connection-provider');
const GraphLite = require('../src');
const chalk = require('chalk');

const connection = new connectionProvider('./test/databases/test.db');

const graphlite = new GraphLite({ connection });

try {

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
        type: 'money',
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
        join: ['ComplementoAplicacao']
      }
    }
  });

  const groups = graphlite.defineSchema('group', {
    tableName: 'GRUPOPRODUTO',
    properties: {
      CodigoGrupoProduto: 'primaryKey',
      DescricaoGrupoProduto: 'string'
    }
  });


  products.hasMany(aplications, {
    foreignTable: 'PRODUTO_APLICACAO',
    foreignKey: 'CodigoAplicacao'
  });
  products.hasOne(groups);
  groups.belongsTo(products);
  aplications.belongsTo(products, {
    foreignTable: 'PRODUTO_APLICACAO',
    foreignKey: 'CodigoAplicacao'
  });
  //
  aplications.hasOne(automakers);
  automakers.belongsTo(aplications);
  // 
  automakers.hasOne(aplications);
  aplications.belongsTo(automakers);

  const test = graphlite.defineQuery('test', {
    product: {
      properties: [
        'DescricaoProduto'
      ],
      group: {
        properties: '*'
      },
      aplication: {
        properties: '*',
        automaker: {
          properties: '*'
        }
      },
    }
  });

  const test2 = graphlite.defineQuery('test2', {
    product: {
      properties: '*',
      automaker: {
        properties: '*',
        aplication: {
          properties: '*'
        },
        groupBy: "DescricaoFabricante"
      }
    }
  });

  graphlite.test('test2', {
    chaveDaMontadora: ">=11116"
  });

} catch (exception) {
  console.log(chalk.red(exception));
  console.log(exception);
}

// sourceKey, targetKey
// sourceTable, targetTable