module.exports = function(graphlite, schemas) {
  return graphlite.defineQuery('products', {
    product: {
      // vehicle: {
      //   properties: [
      //     'vehicleDescription'
      //   ],
      //   automaker: 1,
      //   // groupBy: ['vehicleDescription'],
      //   // orderBy: ['vehicleDescription']
      // },
      automaker: {
        vehicle: '*',
        groupBy: ['automakerDescription'],
      }
    },
  });
};