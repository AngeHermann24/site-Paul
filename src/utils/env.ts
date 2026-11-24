/**
 * Accès typé aux variables d'environnement publiques (préfixe VITE_).
 * Ne JAMAIS placer de clé `service_role` ici : tout ce qui est préfixé VITE_ est exposé au navigateur.
 */
export const env = {
  siteUrl: (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '',
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
