import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr/common';
import en from './en/common';
import { DEFAULT_LANG, isLang, LANGS, type Lang } from '@/routes/paths';

export const resources = {
  fr: { common: fr },
  en: { common: en },
} as const;

/** Langue initiale lue dans l'URL (`/en/...`) pour éviter tout flash de langue au premier rendu. */
function initialLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const segment = window.location.pathname.split('/')[1];
  return isLang(segment) ? segment : DEFAULT_LANG;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLang(),
  fallbackLng: DEFAULT_LANG,
  supportedLngs: [...LANGS],
  defaultNS: 'common',
  ns: ['common'],
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
