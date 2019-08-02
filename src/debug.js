const keys = require('lodash/keys');
const isObject = require('lodash/isObject');
const chalk = require('chalk');
const util = require('util');

const { log } = console;
const logColor = chalk.white;
const logInfo = chalk.black.bgCyanBright;
const warnColor = chalk.yellow;
const errorColor = chalk.red;

class Debug {
  constructor() {
    this.enabled = {
      log: true,
      info: true,
      warn: true,
      error: true,
    };
  }

  setDebugMode(mode) {
    return mode ? this.enable() : this.disable();
  }

  enable() {
    keys(this.enabled).forEach((key) => {
      this.enabled[key] = true;
    });
  }

  enableLog() {
    this.enabled.log = true;
  }

  enableInfo() {
    this.enabled.info = true;
  }

  enableWarn() {
    this.enabled.warn = true;
  }

  enableError() {
    this.enabled.error = true;
  }

  disable() {
    keys(this.enabled).forEach((key) => {
      this.enabled[key] = false;
    });
  }

  disableLog() {
    this.enabled.log = false;
  }

  disableInfo() {
    this.enabled.info = false;
  }

  disableWarn() {
    this.enabled.warn = false;
  }

  disableError() {
    this.enabled.error = false;
  }

  // eslint-disable-next-line class-methods-use-this
  _parseArgs(...args) {
    return args.map((arg) => {
      if (isObject(arg)) {
        return util.inspect(arg, {
          colors: true,
          depth: null,
        });
      }
      return arg;
    });
  }

  log(...args) {
    if (this.enabled.log) log(logColor(this._parseArgs(...args)));
  }

  info(...args) {
    if (this.enabled.info) log(logInfo(this._parseArgs(...args)));
  }

  warn(...args) {
    if (this.enabled.warn) log(warnColor(this._parseArgs(...args)));
  }

  error(...args) {
    if (this.enabled.error) log(errorColor(this._parseArgs(...args)));
  }
}

module.exports = new Debug();
