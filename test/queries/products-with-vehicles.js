module.exports = function(graphlite) {
  return graphlite.defineQuery('products-with-vehicles', {
    product: {
      vehicle: {
        automaker: {
          groupBy: ['automakerDescription'],
          orderBy: ['automakerDescription']
        },
        size: 2,
      },
      orderBy: ['number', 'description'],
    }
  });
}