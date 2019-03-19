const chalk = require('chalk');
const toTab = require('./to-tab');

module.exports = function success() {
  const m = Array
    .from(arguments)
    .map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)
    .join(' ');
  console.log(chalk.green(toTab(m)));
}