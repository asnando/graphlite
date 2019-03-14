const TAB_SIZE = require('./tab-size.js');

module.exports = function toTab(message) {
  message = [message];
  for (let index = 0; index < TAB_SIZE - 1; index++)
    message.unshift(' ');
  return message.join(' ');
}

