/* eslint-disable no-param-reassign */
const keys = require('lodash/keys');

const unaccent = (value) => {
  const letters = {
    a: ['á', 'à', 'â', '', 'ã', 'ª'],
    e: ['é', 'è', 'ê', ''],
    i: ['í', 'ì', 'î', ''],
    o: ['ó', 'ò', 'ô', '', 'õ', 'º'],
    u: ['ú', 'ù', 'û', ''],
    c: ['ç'],
  };
  value = value.toLowerCase();
  const letterKeys = keys(letters);
  for (let a = 0; a < value.length; a += 1) {
    const char = value.charAt(a);
    // eslint-disable-next-line no-loop-func
    letterKeys.forEach((letter) => {
      if (letters[letter].includes(char)) {
        value = value.replace(value.charAt(a), letter);
      }
    });
  }
  return value;
};

module.exports = unaccent;
