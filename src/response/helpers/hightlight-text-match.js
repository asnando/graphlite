const replaceWithAccentuatedChain = require('../../utils/replace-with-accentuated-chain');

const hightlightTextMatch = (input, output, markup = '<strong>') => {
  input = `(${replaceWithAccentuatedChain(input)})`;
  const rgxp = new RegExp(input, 'ig');
  const open = markup;
  const close = markup.replace(/\</, '</');
  return output.replace(rgxp, `${open}$1${close}`);
};

module.exports = hightlightTextMatch;
