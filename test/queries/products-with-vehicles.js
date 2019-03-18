module.exports = function(graphlite) {
  return graphlite.defineQuery('products-with-vehicles', {
    product: {
      // properties: [
      //   'description',
      //   'number',
      // ],
      properties: '*',
      vehicle: {
        alias: 'vehicle',
        properties: '*',
        automaker: {
          properties: '*',
          where: {
            descricaofabricante: '=DescricaoFabricante'
          },
          shows: {
            descricaofabricante: '=DescricaoFabricante'
          }
        },
        // shows: {
        //   descricaoveiculo: '=DescricaoAplicacao'
        // },
        // where: {
        //   descricaoveiculo: '=DescricaoAplicacao'
        // },
      },
      size: 100,
      orderBy: ['NumeroProduto', 'DescricaoProduto']
    }
  });
}