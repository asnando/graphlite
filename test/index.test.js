const connectionProvider = require('./connection-provider');
const graphlite = require('../src');

const connection = new connectionProvider('./test/databases/test.db');

const products = {
  name: 'product',
  tableName: 'PRODUTO',
  properties: {
    DescricaoProduto: 'string',
    Numero: {
      type: 'string',
      alias: 'NumeroProduto'
    },
    FotoProduto: {
      resolve: ['ArquivoFotoProduto', 'ArquivoFotoProduto2']
    }
  },
  hasMany: 'aplication'
}

const makers = {
  name: 'maker',
  tableName: 'fabricante',
  properties: {
    DescricaoFabricante: 'string'
  }
}

const aplications = {
  name: 'aplication',
  tableName: 'APLICACAO',
  properties: {
    DescricaoAplicacao: 'string',
    complemento: {
      join: ['ComplementoAplicacao2', 'ComplementoAplicacao']
    }
  },
  hasOne: 'maker'
};

const result = {
  name: 'result',
  graph: {
    product: {
      properties: "*",
      aplication: {
        properties: [
          "DescricaoAplicacao",
        ],
        // maker: {
        //   properties: "*"
        // }
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


const instance = new graphlite({
  connection,
  schema: [
    products,
    makers,
    aplications,
    // result
  ],
  queries: [
    result,
    // makersList
  ]
});

instance.test('result');