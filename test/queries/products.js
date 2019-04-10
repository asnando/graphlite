module.exports = function(graphlite, schemas) {
  return graphlite.defineQuery('products', {
    product: {
      // image: '*',
      // vehicle: 1,
      // automaker: 1,
      vehicle: {
        // automaker: '1',
      },
      // automaker: {
      //   vehicle: '*',
      //   groupBy: ['automakerDescription']
      // }
    },
  });
};