const isString = require('lodash/isString');
const replaceWithAccentuatedChain = require('../../utils/replace-with-accentuated-chain');

const hightlightTextMatch = (input, output, markup = '<strong>') => {
  // Support inputed string as string containing space. In that
  // cases filters are used with condition repeating N times for
  // each splited value of string, and in the response parser
  // is needed to separate each word from string to parse recursively.
  if (isString(input) && /\s/.test(input)) {
    const chunks = input.split(' ');
    return chunks.slice(1).reduce((a, b) => {
      return hightlightTextMatch(b, a, markup);
    }, hightlightTextMatch(chunks[0], output, markup));
  }
  input = `(${replaceWithAccentuatedChain(input)})`;
  const rgxp = new RegExp(input, 'ig');
  const open = markup;
  const close = markup.replace(/\</, '</');
  return output.replace(rgxp, `${open}$1${close}`);
};

module.exports = hightlightTextMatch;
