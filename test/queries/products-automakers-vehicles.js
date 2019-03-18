module.exports = function(graphlite) {
  return graphlite.defineQuery('products-automakers-vehicles', {
    product: {
      properties: '*',
      automaker: {
        properties: '*',
        vehicle: {
          properties: '*'
        }
      }
    }
  });
}