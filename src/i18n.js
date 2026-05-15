import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

// Bump this when you make a breaking change to translation keys to force every
// browser to re-detect/refresh the cached language. Stored in localStorage as
// `i18nVersion`; if it differs from the current value we wipe `i18nextLng`.
const I18N_VERSION = '2026-05-15-1';

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('i18nVersion');
    if (stored !== I18N_VERSION) {
      window.localStorage.removeItem('i18nextLng');
      window.localStorage.setItem('i18nVersion', I18N_VERSION);
    }
  }
} catch {
  /* SSR / privacy mode → ignore */
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    // Only two real languages — every regional variant (es-MX, es-419, en-GB,
    // pt-BR, …) is collapsed to its base via `load: 'languageOnly'`. This
    // prevents i18next from looking up missing namespaces like `es-MX` and
    // silently falling back to whichever locale won the race.
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'es',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // keys or params to lookup language from
      caches: ['localStorage']
    }
  });

export default i18n;
