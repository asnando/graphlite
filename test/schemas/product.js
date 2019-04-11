module.exports = function(graphlite) {
  return graphlite.defineSchema({
    name: 'product',
    tableName: 'PRODUTO',
    properties: {
      CodigoProduto: 'primaryKey',
      description: {
        type: 'string',
        alias: 'DescricaoProduto',
      },
      number: {
        type: 'string',
        alias: 'NumeroProduto'
      },
      image: {
        type: 'string',
        resolve: [
          'ArquivoFotoProduto',
          'ArquivoFotoProduto2'
        ]
      },
      release: {
        alias: 'FlagLancamento',
        type: 'boolean'
      },
      FlagPontaEstoque: 'boolean'
    }
  });
}