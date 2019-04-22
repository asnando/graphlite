module.exports = function(graphlite) {
  return graphlite.defineSchema({
    name: 'productmaker',
    tableName: 'FABRICANTE',
    properties: {
      CodigoFabricante: 'primaryKey',
      productMakerDescription: {
        type: 'string',
        alias: 'DescricaoFabricante'
      },
    }
  });
}