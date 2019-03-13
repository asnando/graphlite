module.exports = function(graphlite) {
  return graphlite.defineSchema({
    name: 'automaker',
    tableName: 'FABRICANTE',
    properties: {
      CodigoFabricante: 'primaryKey',
      automakerDescription: {
        type: 'string',
        alias: 'DescricaoFabricante'
      },
    }
  });
}