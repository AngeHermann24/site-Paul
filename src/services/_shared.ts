import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabase, type TypedSupabaseClient } from '@/integrations/supabase/client';
import type { Lang } from '@/routes/paths';

export type ServiceErrorKind = 'not_configured' | 'not_found' | 'rate_limited' | 'validation' | 'network' | 'auth' | 'unknown';

export interface ServiceError {
  kind: ServiceErrorKind;
  message: string;
}

export type ServiceResult<T> = { data: T; error: null } | { data: null; error: ServiceError };

export const success = <T>(data: T): ServiceResult<T> => ({ data, error: null });
export const failure = <T = never>(kind: ServiceErrorKind, message: string): ServiceResult<T> => ({ data: null, error: { kind, message } });

/**
 * Contenus DEMO (seed.sql) : visibles en développement, masqués en production
 * sauf si VITE_ALLOW_DEMO_CONTENT=true (préproduction de démonstration).
 */
export const allowDemoContent = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_CONTENT === 'true';

/** Traduit une erreur PostgREST / réseau en erreur de service affichable. */
export function toServiceError(error: PostgrestError | Error | null | undefined): ServiceError {
  if (!error) return { kind: 'unknown', message: 'Unknown error' };
  const message = error.message ?? String(error);
  if (message.includes('RATE_LIMITED')) return { kind: 'rate_limited', message };
  if ('code' in error && (error.code === '23514' || error.code === '23502' || error.code === '22P02')) {
    return { kind: 'validation', message };
  }
  if (error instanceof TypeError || /fetch|network/i.test(message)) return { kind: 'network', message };
  return { kind: 'unknown', message };
}

/** Exécute une requête avec le client typé ; gère « non configuré » et les exceptions réseau. */
export async function run<T>(
  task: (db: TypedSupabaseClient) => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<ServiceResult<NonNullable<T>>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  try {
    const { data, error } = await task(db);
    if (error) return { data: null, error: toServiceError(error) };
    if (data === null || data === undefined) return failure('not_found', 'Not found');
    return success(data as NonNullable<T>);
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}

/** Choisit la version FR ou EN d'un champ bilingue (aucune traduction automatique). */
export const pick = <T>(lang: Lang, fr: T, en: T): T => (lang === 'fr' ? fr : en);
