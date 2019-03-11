const chalk = require('chalk');

module.exports = function success() {
  const m = Array
    .from(arguments)
    .map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)
    .join(' ');
  console.log(chalk.green(m));
}