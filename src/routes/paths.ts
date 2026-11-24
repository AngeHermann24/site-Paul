export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';
export const LANG_STORAGE_KEY = 'paul.lang';

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && (LANGS as readonly string[]).includes(value);
}

/** Segments de route (identiques en FR et EN, seul le préfixe de langue change). */
export const ROUTES = {
  home: '',
  champion: 'champion',
  fights: 'combats',
  performance: 'performance',
  gym: 'gym',
  commentator: 'commentateur',
  news: 'actualites',
  media: 'medias',
  sponsors: 'sponsors',
  contact: 'contact',
  legal: 'mentions-legales',
  privacy: 'confidentialite',
  cookies: 'cookies',
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Construit un chemin localisé : `localePath('en', 'fights', 'slug')` → `/en/combats/slug`. */
export function localePath(lang: Lang, key: RouteKey, slug?: string): string {
  const segment = ROUTES[key];
  const parts = [lang, segment, slug].filter((p): p is string => Boolean(p));
  return `/${parts.join('/')}`;
}

/** Remplace le préfixe de langue d'un pathname en conservant le reste. */
export function switchLangInPath(pathname: string, next: Lang): string {
  const parts = pathname.split('/');
  if (isLang(parts[1])) parts[1] = next;
  else parts.splice(1, 0, next);
  return parts.join('/') || `/${next}`;
}

export function detectPreferredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) ?? undefined;
    if (isLang(stored)) return stored;
  } catch {
    // localStorage indisponible (navigation privée stricte) : on ignore.
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : '';
  return isLang(nav) ? nav : DEFAULT_LANG;
}
