module.exports = function(graphlite) {
  return graphlite.defineQuery('products-with-vehicles', {
    product: {
      properties: '*',
      vehicles: {
        alias: 'vehicle',
        properties: '*',
        automaker: {
          properties: '*',
        },
        // This is not yet supported !!
        options: {
          showsWhen: {
            DescricaoFabricante: 'descricaofabricante'
          }
        }
      },
      size: 100,
      orderBy: ['NumeroProduto', 'DescricaoProduto']
    }
  });
}