const replaceWithAccentuatedChain = require('./replace-with-accentuated-chain');

const replaceWithCharactersChain = str => (
  replaceWithAccentuatedChain(str)
    .replace(/([bdfghjklmnpqrstvxyz])/ig, (a, char) => `[${char}${char.toUpperCase()}]`)
);

module.exports = replaceWithCharactersChain;
