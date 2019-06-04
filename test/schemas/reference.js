module.exports = function(g) {
  return g.defineSchema('reference', {
    tableName: 'REFERENCIACRUZADA',
    properties: {
      CodigoReferenciaCruzada: 'primaryKey',
      referenceNumber: {
        alias: 'NumeroProduto'
      }
    }
  });
}