const keys = require('lodash/keys');

class Locales {
  constructor() {
    Object.assign(this, {
      locales: [],
      defaultLocale: null,
    });
  }

  defineLocales(locales = {}) {
    const localesKeys = Object.keys(locales);
    const firstLocale = localesKeys[0];
    Object.assign(this, {
      locales,
      defaultLocale: firstLocale,
    });
  }

  detectLocale(locale) {
    const { locales, defaultLocale } = this;
    const useLocale = locale || defaultLocale;
    if (this.includes(useLocale)) {
      return locales[useLocale];
    }
    return { columnSuffix: '' };
  }

  // Set the default current active locale.
  setLocale(locale) {
    if (!this.includes(locale)) {
      throw new Error(`Unsupported locale "${locale}"`);
    }
    this.defaultLocale = locale;
  }

  includes(locale) {
    const { locales } = this;
    const localesKeys = keys(locales);
    return !!localesKeys.find(loc => loc === locale);
  }
}

module.exports = Locales;
