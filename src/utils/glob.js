const keys    = require('./keys'),
      accents = require('./accents');

module.exports = function glob(value) {
  const chars = {
    a: "[AÁÀÂÄÃªaáàâäã]",
    e: "[EÉÈÊËeéèêë]",
    i: "[IÍÌÎÏiíìîï]",
    o: "[OÓÒÔÖÕºoóòôöõ]",
    u: "[UÚÙÛÜuúùûü]",
    c: "[CÇcç]"
  };
  value = accents(value);
  const charKeys = keys(chars);
  return '*' + value.split('').map(char => {
    return charKeys.includes(char) ? chars[char] : `[${char.toUpperCase()}${char}]`;
  }).join('') + '*';
}