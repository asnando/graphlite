const keys = require('./keys');

module.exports = function accents(value) {
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
  for (let a = 0; a < value.length; a++) {
    const char = value.charAt(a);
    letterKeys.forEach(letter => {
      if (letters[letter].includes(char)) {
        value = value.replace(value.charAt(a), letter);
      }
    });
  }
  return value;
}