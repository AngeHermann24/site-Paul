import { useCallback } from 'react';
import { useParams } from 'react-router';
import { DEFAULT_LANG, isLang, localePath, type Lang, type RouteKey } from '@/routes/paths';

export function useLang(): Lang {
  const { lang } = useParams();
  return isLang(lang) ? lang : DEFAULT_LANG;
}

/** Retourne une fonction `to('fights', slug?)` qui construit un chemin dans la langue courante. */
export function useLocalePath(): (key: RouteKey, slug?: string) => string {
  const lang = useLang();
  return useCallback((key: RouteKey, slug?: string) => localePath(lang, key, slug), [lang]);
}
