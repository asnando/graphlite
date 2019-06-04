module.exports = function(graphlite) {
  return graphlite.defineSchema({
    name: 'vehicle',
    tableName: 'APLICACAO',
    properties: {
      CodigoAplicacao: 'primaryKey',
      vehicleDescription: {
        type: 'string',
        alias: 'DescricaoAplicacao'
      },
      type: {
        type: 'string',
        alias: 'ComplementoAplicacao3_5'
      },
      model: {
        type: 'string',
        alias: 'ComplementoAplicacao3_1'
      }
    }
  });
}