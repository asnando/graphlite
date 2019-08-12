const isString = require('lodash/isString');

const replaceWithAccentuatedChain = (str = '') => {
  const chains = [
    'AÁÀÂÄÃªaáàâäã',
    'EÉÈÊËeéèêë',
    'IÍÌÎÏiíìîï',
    'OÓÒÔÖÕºoóòôöõ',
    'UÚÙÛÜuúùûü',
    'CÇcç',
  ];
  return (isString(str) ? str : str.toString()).split('').map((char) => {
    const chainMatch = chains.find(chain => chain.indexOf(char) >= 0);
    return chainMatch ? `[${chainMatch}]` : char;
  }).join('');
};

module.exports = replaceWithAccentuatedChain;
