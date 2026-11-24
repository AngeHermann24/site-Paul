/**
 * Edge Function `submit-request` — point d'entrée serveur des formulaires publics.
 *
 * Rôle :
 *   1. re-valide le payload avec les mêmes schémas zod que le client (`_shared/request-schemas.ts`) ;
 *   2. vérifie le jeton Turnstile si `TURNSTILE_SECRET_KEY` est configurée ;
 *   3. insère la demande via `service_role` (le trigger `guard_public_request` reste actif :
 *      statut forcé, champs internes vidés, anti-spam par email/global) ;
 *   4. pour les fichiers déclarés : crée des URLs d'upload signées dans le bucket privé
 *      `attachments` et inscrit le chemin prévu dans la ligne (`logo_path` / `attachment_path`) ;
 *   5. notifie l'équipe par email via Resend si `RESEND_API_KEY` + `NOTIFY_EMAIL_TO` +
 *      `NOTIFY_EMAIL_FROM` sont configurés → `email_notified_at`, sinon `email_notification_error`
 *      reçoit `not_configured` (l'admin affiche « notification email non activée »).
 *
 * Jamais de service_role côté navigateur : cette clé vit uniquement dans l'environnement
 * de la function (`SUPABASE_SERVICE_ROLE_KEY`, injectée par la plateforme).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_TYPES,
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  SCHEMAS,
} from '../_shared/request-schemas.ts';

const ALLOWED_TABLES = {
  contact_messages: 'contact',
  gym_registration_requests: 'gym',
  booking_requests: 'booking',
  sponsorship_requests: 'sponsorship',
} as const;
type RequestTable = keyof typeof ALLOWED_TABLES;

const FILE_COLUMNS = { logo: 'logo_path', attachment: 'attachment_path' } as const;
type FileField = keyof typeof FILE_COLUMNS;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });

interface DeclaredFile {
  field: FileField;
  name: string;
  type: string;
  size: number;
}

function checkFile(f: DeclaredFile): boolean {
  if (f.field === 'logo') return LOGO_MIME_TYPES.includes(f.type as never) && f.size <= LOGO_MAX_BYTES;
  if (f.field === 'attachment') return ATTACHMENT_MIME_TYPES.includes(f.type as never) && f.size <= ATTACHMENT_MAX_BYTES;
  return false;
}

const MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return true; // non configuré : la vérification est désactivée
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  }).catch(() => null);
  const data = res ? ((await res.json().catch(() => null)) as { success?: boolean } | null) : null;
  return data?.success === true;
}

async function notifyEmail(
  // deno-lint-ignore no-explicit-any
  admin: any,
  table: RequestTable,
  id: string,
  summary: string,
) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_EMAIL_TO');
  const from = Deno.env.get('NOTIFY_EMAIL_FROM');
  if (!apiKey || !to || !from) {
    await admin.from(table).update({ email_notification_error: 'not_configured' }).eq('id', id);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[PAUL] Nouvelle demande — ${table}`,
      text: summary,
    }),
  }).catch(() => null);
  const ok = res?.ok === true;
  await admin
    .from(table)
    .update(ok ? { email_notified_at: new Date().toISOString() } : { email_notification_error: res ? `HTTP ${res.status}` : 'network' })
    .eq('id', id);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  let body: { table?: string; data?: Record<string, unknown>; files?: DeclaredFile[]; turnstile_token?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'validation' }, 400);
  }

  const table = body.table as RequestTable | undefined;
  if (!table || !(table in ALLOWED_TABLES)) return json({ ok: false, error: 'validation' }, 400);

  const data = (body.data ?? {}) as Record<string, unknown>;

  // Honeypot : champ rempli par un bot → faux succès, rien n'est enregistré.
  if (typeof data.website === 'string' && data.website.length > 0) {
    return json({ ok: true });
  }

  // Validation zod (les mêmes bornes que le client et que la base).
  const parsed = SCHEMAS[ALLOWED_TABLES[table]].safeParse(data);
  if (!parsed.success) return json({ ok: false, error: 'validation' }, 400);

  // Turnstile (actif seulement si le secret est configuré).
  if (!(await verifyTurnstile(body.turnstile_token ?? null))) {
    return json({ ok: false, error: 'turnstile' }, 400);
  }

  // Fichiers déclarés : seul le sponsoring en a, allowlist MIME + taille (bucket `attachments`).
  const files = Array.isArray(body.files) ? body.files : [];
  if (table !== 'sponsorship_requests' || files.length > 2 || !files.every((f) => checkFile(f))) {
    return json({ ok: false, error: 'validation' }, 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { consent: _consent, website: _website, ...rest } = parsed.data as Record<string, unknown>;
  const row = { ...rest, consent: true };

  const { data: inserted, error: insertError } = await admin.from(table).insert(row).select('id').single();
  if (insertError) {
    const kind = String(insertError.message).includes('RATE_LIMITED') ? 'rate_limited' : 'internal';
    return json({ ok: false, error: kind }, kind === 'rate_limited' ? 429 : 500);
  }
  const id: string = inserted.id;

  // Chemins prévisibles `table/id/champ.ext` + URLs d'upload signées. Le chemin est inscrit
  // en base : l'admin voit où le fichier est censé être même si l'upload échoue ensuite.
  const uploads: Partial<Record<FileField, { path: string; token: string }>> = {};
  const pathUpdates: Record<string, string> = {};
  for (const f of files) {
    const ext = MIME_EXT[f.type] ?? 'bin';
    const path = `${table}/${id}/${f.field}.${ext}`;
    pathUpdates[FILE_COLUMNS[f.field]] = path;
    const { data: signed, error } = await admin.storage.from('attachments').createSignedUploadUrl(path);
    if (!error && signed) uploads[f.field] = { path, token: signed.token };
  }
  if (Object.keys(pathUpdates).length > 0) {
    await admin.from(table).update(pathUpdates).eq('id', id);
  }

  // Notification email (Resend si configuré ; sinon trace honnête pour l'admin).
  const summary = Object.entries(rest)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');
  await notifyEmail(admin, table, id, `Nouvelle demande ${table} (${id})\n\n${summary}`);

  return json({ ok: true, id, uploads });
});
