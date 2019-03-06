const chalk = require('chalk');

module.exports = function warn() {
  const m = Array
    .from(arguments)
    .map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)
    .join(' ');
  console.log(chalk.red(m));
}