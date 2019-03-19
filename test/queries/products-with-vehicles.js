module.exports = function(graphlite) {
  return graphlite.defineQuery('products-with-vehicles', {
    product: {
      properties: [
        'description',
        'number',
        'release'
      ],
      vehicle: {
        alias: 'vehicle',
        properties: '*',
        automaker: {
          properties: '*',
          size: 3,
          // where: {
          //   descricaofabricante: '=automakerDescription'
          // },
          // shows: {
          //   descricaofabricante: '=automakerDescription'
          // },
          groupBy: ['automakerDescription'],
          orderBy: ['automakerDescription']
        },
      },
      size: 100,
      orderBy: ['number', 'description'],
    }
  });
}