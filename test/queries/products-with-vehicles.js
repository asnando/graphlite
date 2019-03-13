module.exports = function(graphlite) {
  return graphlite.defineQuery('products-with-vehicles', {
    product: {
      properties: '*',
      vehicles: {
        alias: 'vehicle',
        properties: '*',
        automaker: {
          properties: '*'
        }
      }
    }
  });
}