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
      complement: {
        type: 'string',
        alias: 'ComplementoAplicacao'
      }
    }
  });
}