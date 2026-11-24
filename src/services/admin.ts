/**
 * Services du back-office `/admin`.
 *
 * Toutes les requêtes passent par la RLS : l'utilisateur doit être connecté ET actif
 * dans `admin_users` (vérifié par `is_admin()` côté base). Le frontend ne fait aucun
 * contrôle de sécurité propre — il ne fait qu'afficher ce que la base autorise.
 */
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
import { failure, success, toServiceError, type ServiceResult } from './_shared';

export type AdminRole = 'owner' | 'admin' | 'editor';
export type RequestStatus = 'new' | 'in_review' | 'contacted' | 'accepted' | 'rejected' | 'archived';
export const REQUEST_STATUSES: readonly RequestStatus[] = ['new', 'in_review', 'contacted', 'accepted', 'rejected', 'archived'];

export const REQUEST_TABLES = ['contact_messages', 'gym_registration_requests', 'booking_requests', 'sponsorship_requests'] as const;
export type RequestTable = (typeof REQUEST_TABLES)[number];

/** Ligne générique rendue par PostgREST (le back-office est piloté par la config des ressources). */
export type AdminRow = Record<string, unknown> & { id: string };

// ------------------------------------------------------------------ Auth

export async function signInAdmin(email: string, password: string): Promise<ServiceResult<User>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return failure(error?.message?.includes('Invalid login') ? 'auth' : 'unknown', error?.message ?? 'no user');
  }
  return success(data.user);
}

export async function signOutAdmin(): Promise<ServiceResult<true>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { error } = await db.auth.signOut();
  return error ? { data: null, error: toServiceError(error) } : success(true);
}

export async function getAdminSession(): Promise<ServiceResult<{ user: User; role: AdminRole } | null>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  try {
    const { data } = await db.auth.getSession();
    const user = data.session?.user;
    if (!user) return success(null);
    const role = await fetchAdminRole(user.id);
    return success(role ? { user, role } : null);
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}

/** Rôle admin de l'utilisateur, ou null (non admin / désactivé). `admin_users` est filtré par RLS. */
export async function fetchAdminRole(userId: string): Promise<AdminRole | null> {
  const db = await getSupabase();
  if (!db) return null;
  const { data } = await db
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return role === 'owner' || role === 'admin' || role === 'editor' ? role : null;
}

// ------------------------------------------------------------------ CRUD générique (contenus)

export interface AdminListParams {
  search?: string;
  searchCols?: readonly string[];
  order?: string;
  ascending?: boolean;
  offset?: number;
  limit?: number;
}

export interface AdminListResult {
  rows: AdminRow[];
  total: number;
}

export async function adminList(table: string, params: AdminListParams = {}): Promise<ServiceResult<AdminListResult>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  try {
    let q = db.from(table as never).select('*', { count: 'exact' });
    if (params.order) q = q.order(params.order, { ascending: params.ascending ?? true });
    if (params.search && params.searchCols?.length) {
      const esc = params.search.replace(/[%,()]/g, ' ');
      q = q.or(params.searchCols.map((c) => `${c}.ilike.*${esc}*`).join(','));
    }
    if (params.limit) q = q.range(params.offset ?? 0, (params.offset ?? 0) + params.limit - 1);
    const { data, count, error } = await q;
    if (error) return { data: null, error: toServiceError(error) };
    return success({ rows: (data ?? []) as AdminRow[], total: count ?? 0 });
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}

export async function adminGet(table: string, id: string): Promise<ServiceResult<AdminRow>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.from(table as never).select('*').eq('id', id).maybeSingle();
  if (error) return { data: null, error: toServiceError(error) };
  if (!data) return failure('not_found', 'row not found');
  return success(data as AdminRow);
}

export async function adminInsert(table: string, payload: Record<string, unknown>): Promise<ServiceResult<AdminRow>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.from(table as never).insert(payload as never).select().single();
  if (error) return { data: null, error: toServiceError(error) };
  return success(data as AdminRow);
}

export async function adminUpdate(table: string, id: string, payload: Record<string, unknown>): Promise<ServiceResult<AdminRow>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.from(table as never).update(payload as never).eq('id', id).select().single();
  if (error) return { data: null, error: toServiceError(error) };
  return success(data as AdminRow);
}

export async function adminDelete(table: string, id: string): Promise<ServiceResult<true>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { error } = await db.from(table as never).delete().eq('id', id);
  return error ? { data: null, error: toServiceError(error) } : success(true);
}

// ------------------------------------------------------------------ Boîte de réception

export async function listRequestRows(
  table: RequestTable,
  opts: { status?: RequestStatus | ''; offset?: number; limit?: number } = {},
): Promise<ServiceResult<AdminListResult>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  try {
    let q = db.from(table as never).select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (opts.status) q = q.eq('status', opts.status);
    q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 25) - 1);
    const { data, count, error } = await q;
    if (error) return { data: null, error: toServiceError(error) };
    return success({ rows: (data ?? []) as AdminRow[], total: count ?? 0 });
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}

export async function updateRequestRow(
  table: RequestTable,
  id: string,
  patch: { status?: RequestStatus; internal_notes?: string | null },
): Promise<ServiceResult<AdminRow>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.from(table as never).update(patch as never).eq('id', id).select().single();
  if (error) return { data: null, error: toServiceError(error) };
  return success(data as AdminRow);
}

/** URL signée de lecture d'une pièce jointe (bucket privé `attachments`, admin seulement). */
export async function signedReadUrl(path: string): Promise<ServiceResult<string>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  const { data, error } = await db.storage.from('attachments').createSignedUrl(path, 3600);
  if (error) return { data: null, error: toServiceError(error) };
  return success(data.signedUrl);
}

// ------------------------------------------------------------------ Dashboard

export interface DashboardCounts {
  requests: Record<RequestTable, number>;
  newRequests: number;
  contents: { fights: number; articles: number; sponsors: number; media: number };
  drafts: number;
}


export async function fetchDashboardCounts(): Promise<ServiceResult<DashboardCounts>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  try {
    const count = async (table: string, filter?: { col: string; val: string }) => {
      let q = db.from(table as never).select('id', { count: 'exact', head: true });
      if (filter) q = q.eq(filter.col, filter.val);
      const { count: n, error } = await q;
      if (error) throw error;
      return n ?? 0;
    };
    const [contact, gym, booking, sponsor, fights, articles, sponsors, media, drafts] = await Promise.all([
      count('contact_messages'),
      count('gym_registration_requests'),
      count('booking_requests'),
      count('sponsorship_requests'),
      count('fights'),
      count('articles'),
      count('sponsors'),
      count('media'),
      count('fights', { col: 'status', val: 'draft' }),
    ]);
    const newReq =
      (await count('contact_messages', { col: 'status', val: 'new' })) +
      (await count('gym_registration_requests', { col: 'status', val: 'new' })) +
      (await count('booking_requests', { col: 'status', val: 'new' })) +
      (await count('sponsorship_requests', { col: 'status', val: 'new' }));
    return success({
      requests: { contact_messages: contact, gym_registration_requests: gym, booking_requests: booking, sponsorship_requests: sponsor },
      newRequests: newReq,
      contents: { fights, articles, sponsors, media },
      drafts,
    });
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}
