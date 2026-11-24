/**
 * Envoi des demandes publiques.
 *
 * Deux canaux possibles :
 *   1. `VITE_SUBMIT_FUNCTION=true` → Edge Function `submit-request` (validation serveur,
 *      Turnstile, URLs d'upload signées pour les pièces jointes, notification email).
 *   2. Sinon → INSERT direct (RLS : le public a le droit INSERT seul, jamais de SELECT).
 *      Les pièces jointes ne sont alors pas proposées (`canAttachFiles === false`).
 *
 * ⚠️ Pas de `.select()` après l'insert : le public n'a aucun droit SELECT sur ces tables.
 */
import type { TablesInsert } from '@/integrations/supabase/database.types';
import { getSupabase } from '@/integrations/supabase/client';
import { env } from '@/utils/env';
import { failure, success, toServiceError, type ServiceResult } from './_shared';

type RequestTable = 'contact_messages' | 'booking_requests' | 'sponsorship_requests' | 'gym_registration_requests';

/** Identifiant fonctionnel de chaque formulaire (corps de l'appel à l'Edge Function). */
export type RequestKind = 'contact' | 'booking' | 'sponsorship' | 'gym';

const KIND_TO_TABLE = {
  contact: 'contact_messages',
  booking: 'booking_requests',
  sponsorship: 'sponsorship_requests',
  gym: 'gym_registration_requests',
} as const satisfies Record<RequestKind, RequestTable>;

/** Champs de traitement réservés à l'admin : jamais envoyés depuis le site public. */
type PublicInsert<T extends RequestTable> = Omit<
  TablesInsert<T>,
  'id' | 'status' | 'internal_notes' | 'handled_by' | 'handled_at' | 'email_notified_at' | 'email_notification_error' | 'created_at' | 'updated_at'
>;

/** Champs fichier disponibles sur les demandes (sponsorship : logo + attachment). */
export type RequestFileField = 'logo' | 'attachment';
export interface RequestFile {
  field: RequestFileField;
  file: File;
}

export interface SubmitOptions {
  files?: RequestFile[];
  turnstileToken?: string | null;
}

export interface SubmitOutcome {
  /** Champs dont l'upload a échoué (la demande elle-même est bien enregistrée). */
  uploadWarnings: RequestFileField[];
}

/** `true` quand l'Edge Function est déployée et activée : les pièces jointes deviennent possibles. */
export const canAttachFiles = Boolean(env.supabaseUrl && env.supabaseAnonKey) && import.meta.env.VITE_SUBMIT_FUNCTION === 'true';

async function insertRequest<T extends RequestTable>(table: T, payload: PublicInsert<T>): Promise<ServiceResult<true>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');
  try {
    // Le cast est nécessaire car TypeScript ne résout pas l'union générique des tables.
    const { error } = await db.from(table).insert(payload as never);
    return error ? { data: null, error: toServiceError(error) } : success(true);
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }
}

interface FunctionUpload {
  path: string;
  token: string;
}

interface FunctionResponse {
  ok?: boolean;
  error?: string;
  uploads?: Partial<Record<RequestFileField, FunctionUpload>>;
}

/** Canal Edge Function : validation serveur + URLs d'upload signées + notification email. */
async function submitViaFunction(
  table: RequestTable,
  payload: Record<string, unknown>,
  opts: SubmitOptions,
): Promise<ServiceResult<SubmitOutcome>> {
  const db = await getSupabase();
  if (!db) return failure('not_configured', 'Supabase is not configured.');

  let json: FunctionResponse | null;
  try {
    const res = await fetch(`${env.supabaseUrl}/functions/v1/submit-request`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // La clé anon est un JWT valide : la function garde `verify_jwt` activé.
        authorization: `Bearer ${env.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        table,
        data: payload,
        files: opts.files?.map((f) => ({ field: f.field, name: f.file.name, type: f.file.type, size: f.file.size })) ?? [],
        turnstile_token: opts.turnstileToken ?? null,
      }),
    });
    json = (await res.json().catch(() => null)) as FunctionResponse | null;
    if (!res.ok || !json?.ok) {
      const kind = json?.error === 'rate_limited' ? 'rate_limited' : res.status === 429 ? 'rate_limited' : json?.error === 'validation' ? 'validation' : 'unknown';
      return failure(kind, json?.error ?? `submit-request HTTP ${res.status}`);
    }
  } catch (e) {
    return { data: null, error: toServiceError(e instanceof Error ? e : new Error(String(e))) };
  }

  // Upload des fichiers déclarés vers les URLs signées du bucket privé `attachments`.
  const uploadWarnings: RequestFileField[] = [];
  for (const { field, file } of opts.files ?? []) {
    const upload = json.uploads?.[field];
    if (!upload) {
      uploadWarnings.push(field);
      continue;
    }
    const { error } = await db.storage.from('attachments').uploadToSignedUrl(upload.path, upload.token, file);
    if (error) uploadWarnings.push(field);
  }
  return success({ uploadWarnings });
}

/**
 * Point d'entrée unique des formulaires publics.
 * `payload` utilise les noms de colonnes SQL (snake_case), sans les champs internes.
 */
export async function submitRequest(
  kind: RequestKind,
  payload: Record<string, unknown>,
  opts: SubmitOptions = {},
): Promise<ServiceResult<SubmitOutcome>> {
  if (canAttachFiles) {
    return submitViaFunction(KIND_TO_TABLE[kind], payload, opts);
  }
  // Canal direct : les fichiers ne sont pas proposés côté UI ; on les ignore par sécurité.
  const res = await insertRequest(KIND_TO_TABLE[kind], payload as never);
  return res.error ? res : success({ uploadWarnings: [] });
}

// ------------------------------------------------------------------ Canal direct (compatibilité tests)
export const submitContactMessage = (p: PublicInsert<'contact_messages'>) => insertRequest('contact_messages', p);
export const submitBookingRequest = (p: PublicInsert<'booking_requests'>) => insertRequest('booking_requests', p);
export const submitSponsorshipRequest = (p: Omit<PublicInsert<'sponsorship_requests'>, 'assigned_to'>) =>
  insertRequest('sponsorship_requests', p);
export const submitGymRegistration = (p: PublicInsert<'gym_registration_requests'>) => insertRequest('gym_registration_requests', p);
