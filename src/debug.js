class Debug {

  constructor() {
    this.enabled = true;
  }

  _setEnabledStatus(status) {
    this.enabled = !!status;
  }

  _isEnabled() {
    return !!this.enabled;
  }

  enable() {
    this._setEnabledStatus(true);
  }

  disable() {
    this._setEnabledStatus(false);
  }

  log() {
    if (this._isEnabled()) {
      return console.log.apply(console, arguments);
    }
  }

  warn() {
    if (this._isEnabled()) {
      return console.warn.apply(console, arguments);
    }
  }

}

module.exports = new Debug();