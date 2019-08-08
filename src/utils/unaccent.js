const unaccent = (str = '') => {
  const chains = {
    A: 'AÁÀÂÄÃ',
    a: 'ªaáàâäã',
    E: 'EÉÈÊË',
    e: 'eéèêë',
    I: 'IÍÌÎÏ',
    i: 'iíìîï',
    O: 'OÓÒÔÖÕ',
    o: 'ºoóòôöõ',
    U: 'UÚÙÛÜ',
    u: 'uúùûü',
    C: 'CÇ',
    c: 'cç',
  };

  const chainsKeys = Object.keys(chains);

  return str
    .split('')
    .map(char => chainsKeys.find(key => chains[key].includes(char)) || char)
    .join('');
};

module.exports = unaccent;
