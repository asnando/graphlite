module.exports = function(graphlite, schemas) {
  return graphlite.defineQuery('full-product', {
    product: {
      // image: 1,
      // group: 1,
      // productmaker: {
      //   groupBy: 'productMakerDescription',
      //   reference: 1
      // },
      // automaker: {
      //   groupBy: 'automakerDescription',
      //   vehicle: 1
      // },
      // // where: {
      // //   number: '=number'
      // // },
      // orderBy: 'description'
    },
  });
};