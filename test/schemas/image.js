module.exports = function(graphlite) {
  return graphlite.defineSchema('image', {
    tableName: 'FOTOS',
    properties: {
      ArquivoFoto: {
        type: 'primaryKey',
      }
    }
  })
}