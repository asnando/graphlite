const connectionProvider = require('./connection-provider');
const GraphLite = require('../src');

const connection = new connectionProvider('./test/databases/test.db');

const graphlite = new GraphLite({
  connection
});

const products = {
  name: 'product',
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
    }
  },
  // hasMany: 'aplication'
  // hasMany: {
  //   aplication: {
  //     tableName: '',
  //     foreignKey: ''
  //   }
  // }
}

const makers = {
  name: 'maker',
  tableName: 'FABRICANTE',
  properties: {
    CodigoFabricante: 'primaryKey',
    DescricaoFabricante: 'string'
  }
}

const aplications = {
  name: 'aplication',
  tableName: 'APLICACAO',
  properties: {
    CodigoAplicacao: 'primaryKey',
    DescricaoAplicacao: 'string',
    complemento: {
      join: ['ComplementoAplicacao2', 'ComplementoAplicacao']
    }
  },
  // hasOne: 'maker'
};

const result = {
  name: 'result',
  graph: {
    product: {
      properties: "*",
      aplication: {
        type: 'array',
        properties: [
          "DescricaoAplicacao",
        ],
      },
      where: {
        DescricaoProduto: "var"
      }
    }
  }
};

const makersList = {
  name: 'markersList',
  graph: {
    maker: {
      properties: [
        "_id",
        "DescricaoFabricante"
      ],
      where: {
        hasOne: "product"
      }
    }
  }
};

graphlite
  .defineSchema(products)
  .defineSchema(makers)
  .defineSchema(aplications)
  .defineQuery(result)
  // .defineQuery(makersList);

graphlite.test('result');