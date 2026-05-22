/** Simple i18n utility — translates keys using locale dictionaries from config */
export type LocaleDictionary = Record<string, string>;
export type Locales = Record<string, LocaleDictionary>;

const DEFAULT_LOCALE = 'en';

export function t(key: string, locales: Locales, currentLocale: string): string {
  const dict = locales[currentLocale] || locales[DEFAULT_LOCALE] || {};
  return dict[key] || key;
}

export function getAvailableLocales(locales: Locales): { code: string; name: string }[] {
  const names: Record<string, string> = {
    en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch',
    it: 'Italiano', pt: 'Português', ja: '日本語', ko: '한국어',
    zh: '中文', ar: 'العربية', hi: 'हिन्दी', ru: 'Русский',
  };
  return Object.keys(locales).map(code => ({ code, name: names[code] || code }));
}
