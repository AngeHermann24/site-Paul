import { useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import i18n from '@/locales';
import { DEFAULT_LANG, isLang, LANG_STORAGE_KEY } from './paths';

/**
 * Valide le préfixe de langue. Un chemin sans préfixe (`/champion`) est redirigé vers `/fr/champion`.
 * Synchronise i18next, l'attribut `<html lang>` et la préférence mémorisée.
 */
export function LangLayout() {
  const { lang } = useParams();
  const { pathname, search, hash } = useLocation();
  const valid = isLang(lang);

  useLayoutEffect(() => {
    if (!isLang(lang)) return;
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // stockage indisponible : sans conséquence
    }
  }, [lang]);

  if (!valid) return <Navigate to={`/${DEFAULT_LANG}${pathname}${search}${hash}`} replace />;
  return <Outlet />;
}
