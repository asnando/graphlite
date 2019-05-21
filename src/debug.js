const keys = require('lodash/keys');

class Debug {

  constructor() {
    this.enabled = {
      log: true,
      warn: true,
      error: true,
    };
  }

  enable() {
    keys(this.enabled).forEach(key => this.enabled[key] = true);
  }

  enableLog() {
    this.enabled.log = true;
  }

  enableWarn() {
    this.enabled.warn = true;
  }

  enableError() {
    this.enabled.error = true;
  }

  disable() {
    keys(this.enabled).forEach(key => this.enabled[key] = false);
  }

  disableLog() {
    this.enabled.log = false;
  }

  disableWarn() {
    this.enabled.warn = false;
  }

  disableError() {
    this.enabled.error = false;
  }

  log() {
    if (this.enabled.log) {
      return console.log.apply(console, arguments);
    }
  }

  warn() {
    if (this.enabled.warn) {
      return console.warn.apply(console, arguments);
    }
  }

  error() {
    if (this.enabled.error) {
      return console.error.apply(console, arguments);
    }
  }

}

module.exports = new Debug();