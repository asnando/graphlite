module.exports = function(graphlite, schemas) {
  return graphlite.defineQuery('products', {
    product: {
      properties: '*'
    },
  });
};