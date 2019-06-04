module.exports = function(g) {
  return g.defineSchema('group', {
    tableName: 'GRUPOPRODUTO',
    properties: {
      CodigoGrupoProduto: 'primaryKey',
      groupDescription: {
        alias: 'DescricaoGrupoProduto'
      }
    }
  });
}