const keys = require('lodash/keys');
const accent = require('./accent');

const glob = (value) => {
  const chars = {
    a: '[AÁÀÂÄÃªaáàâäã]',
    e: '[EÉÈÊËeéèêë]',
    i: '[IÍÌÎÏiíìîï]',
    o: '[OÓÒÔÖÕºoóòôöõ]',
    u: '[UÚÙÛÜuúùûü]',
    c: '[CÇcç]'
  };
  // eslint-disable-next-line no-param-reassign
  value = accent(value);
  const charKeys = keys(chars);
  return `*${value.split('').map((char) => {
    return charKeys.includes(char) ? chars[char] : `[${char.toUpperCase()}${char}]`;
  }).join('')}*`;
};

module.exports = glob;
