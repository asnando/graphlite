module.exports = function(graphlite, schemas) {
  return graphlite.defineQuery('full-product', {
    product: {
      image: 1,
      group: 1,
      // code: {
      //   productmaker: {
      //     groupBy: 'productMakerDescription'
      //   },
      // },
      // reference: {
      //   productmaker: 1
      // },
      productmaker: {
        groupBy: 'productMakerDescription',
        reference: 1
      },
      automaker: {
        using: 'vehicle',
        groupBy: 'automakerDescription',
        where: {
          maker: '%automakerDescription'
        },
        vehicle: {
          // size: 2
        }
      },
      where: {
        number: '=number'
      }
    },
  });
};