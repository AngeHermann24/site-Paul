import { createContext, useContext, type ReactNode } from 'react';
import { useLang } from '@/hooks/useLang';
import { useServiceQuery, type QueryState } from '@/hooks/useServiceQuery';
import { getSiteSettings, type SiteSettings } from '@/services/settings';

type SettingsState = QueryState<SiteSettings>;

const SiteSettingsContext = createContext<SettingsState | null>(null);

/** Paramètres du site chargés une fois par langue (réseaux, coordonnées, médias hero, SEO, textes légaux). */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const lang = useLang();
  const query = useServiceQuery(() => getSiteSettings(lang), [lang]);
  return <SiteSettingsContext.Provider value={query}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettingsState(): SettingsState {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettingsState must be used inside <SiteSettingsProvider>');
  return ctx;
}

/** Raccourci : paramètres ou `null` (non chargés, non configurés, erreur). */
export function useSiteSettings(): SiteSettings | null {
  const state = useSiteSettingsState();
  return state.status === 'success' ? state.data : null;
}
