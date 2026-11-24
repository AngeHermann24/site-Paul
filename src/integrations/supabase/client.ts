import type { SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/utils/env';
import type { Database } from './database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

let client: TypedSupabaseClient | null = null;
let pending: Promise<TypedSupabaseClient | null> | null = null;

/**
 * Client Supabase (clé anon uniquement, jamais service_role), chargé en lazy.
 * Retourne `null` si l'environnement n'est pas configuré : l'UI affiche alors un état honnête.
 */
export function getSupabase(): Promise<TypedSupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  pending ??= import('@supabase/supabase-js').then(({ createClient }) => {
    client = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
  });
  return pending;
}

/** URL publique d'un fichier des buckets publics (`media`, `logos`). */
export function publicStorageUrl(bucket: 'media' | 'logos', path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!env.supabaseUrl) return null;
  const clean = path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${clean}`;
}
