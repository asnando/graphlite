module.exports = function pbcopy(data) {
  if (!process.env.WEBPACK_ENV) {
    var proc = require('child_process').spawn('pbcopy'); 
    proc.stdin.write(data); proc.stdin.end();
  }
}