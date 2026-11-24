/**
 * ⚠️ OUTIL DE TEST UNIQUEMENT — jamais utilisé par le site en production.
 *
 * Démarre :
 *   1. une mini-API compatible PostgREST (sous-ensemble utilisé par src/services) sur :54321,
 *      adossée à PGlite avec les VRAIES migrations + seed DEMO, requêtes exécutées en rôle `anon`
 *      (la RLS s'applique exactement comme en production) ;
 *   2. Vite (port 5175) pointé sur cette API.
 *
 * Usage : npm run dev:e2e   (puis http://localhost:5175)
 *         node scripts/e2e-server.mjs --api-only
 */
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_PORT = 54321;

function guessMime(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', svg: 'image/svg+xml' }[ext] ?? 'application/octet-stream';
}
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

const db = new PGlite();
await db.exec(read('supabase/tests/supabase_shim.sql'));
for (const f of readdirSync(join(root, 'supabase/migrations')).filter((x) => x.endsWith('.sql')).sort()) {
  await db.exec(read(`supabase/migrations/${f}`));
}
await db.exec(read('supabase/seed.sql'));

// ------------------------------------------------------------------ Comptes de test (mock auth)
// admin@e2e.local → owner actif (passe is_admin()) ; fan@e2e.local → authentifié non admin.
const E2E_ADMIN_UID = 'a1b2c3d4-0000-4000-8000-000000000001';
const E2E_FAN_UID = 'a1b2c3d4-0000-4000-8000-000000000002';
await db.query(`insert into auth.users (id, email) values ($1, 'admin@e2e.local'), ($2, 'fan@e2e.local')`, [
  E2E_ADMIN_UID,
  E2E_FAN_UID,
]);
await db.query(
  `insert into public.admin_users (user_id, email, role, is_active) values ($1, 'admin@e2e.local', 'owner', true)`,
  [E2E_ADMIN_UID],
);
const E2E_ACCOUNTS = {
  'admin@e2e.local': { uid: E2E_ADMIN_UID, password: 'e2e-pass' },
  'fan@e2e.local': { uid: E2E_FAN_UID, password: 'e2e-pass' },
};

const IDENT = /^[a-z_][a-z0-9_]*$/;
const ident = (s) => {
  if (!IDENT.test(s)) throw new Error(`identifiant invalide: ${s}`);
  return `"${s}"`;
};

const { rows: fkRows } = await db.query(`
  select cl.relname as tbl, rcl.relname as ref, a.attname as col
  from pg_constraint con
  join pg_class cl on cl.oid = con.conrelid join pg_namespace n on n.oid = cl.relnamespace
  join pg_class rcl on rcl.oid = con.confrelid
  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
  where con.contype = 'f' and n.nspname = 'public'`);

/** `*, service:gym_services(title_fr, title_en)` → fragments SQL. */
function parseSelect(select, table) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of select ?? '*') {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.map((p) => {
    if (p === '*') return 't.*';
    const embed = p.match(/^(?:(\w+):)?(\w+)\(([^)]*)\)$/);
    if (embed) {
      const [, alias, ref, cols] = embed;
      const fk = fkRows.find((r) => r.tbl === table && r.ref === ref);
      if (!fk) throw new Error(`relation inconnue ${table} → ${ref}`);
      const list = cols === '*' ? 'e.*' : cols.split(',').map((c) => `e.${ident(c.trim())}`).join(', ');
      return `(select row_to_json(x) from (select ${list} from public.${ident(ref)} e where e.id = t.${ident(fk.col)}) x) as ${ident(alias ?? ref)}`;
    }
    return `t.${ident(p)}`;
  });
}

function parseValue(v) {
  if (v === 'true' || v === 'false') return v === 'true';
  if (v === 'null') return null;
  return v;
}

function condition(col, expr, params) {
  const m = expr.match(/^(not\.)?(eq|neq|gt|gte|lt|lte|like|ilike|is|in|wfts|fts|plfts)(\((\w+)\))?\.(.*)$/s);
  if (!m) throw new Error(`filtre non supporté: ${col}=${expr}`);
  const [, not, op, , config, raw] = m;
  const c = `t.${ident(col)}`;
  const push = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  let sql;
  switch (op) {
    case 'eq': sql = `${c} = ${push(parseValue(raw))}`; break;
    case 'neq': sql = `${c} <> ${push(parseValue(raw))}`; break;
    case 'gt': sql = `${c} > ${push(raw)}`; break;
    case 'gte': sql = `${c} >= ${push(raw)}`; break;
    case 'lt': sql = `${c} < ${push(raw)}`; break;
    case 'lte': sql = `${c} <= ${push(raw)}`; break;
    case 'like': sql = `${c}::text like ${push(raw.replaceAll('*', '%'))}`; break;
    case 'ilike': sql = `${c}::text ilike ${push(raw.replaceAll('*', '%'))}`; break;
    case 'is': sql = `${c} is ${raw === 'null' ? 'null' : raw === 'true' ? 'true' : 'false'}`; break;
    case 'in': sql = `${c}::text = any(${push(raw.replace(/^\(|\)$/g, '').split(','))})`; break;
    default: {
      const fn = { wfts: 'websearch_to_tsquery', fts: 'to_tsquery', plfts: 'plainto_tsquery' }[op];
      const cfg = config && IDENT.test(config) ? `'${config}', ` : '';
      sql = `${c} @@ ${fn}(${cfg}${push(raw)})`;
    }
  }
  return not ? `not (${sql})` : sql;
}

function buildQuery(table, url) {
  const params = [];
  const where = [];
  let order = '';
  let limit = '';
  let offset = '';
  for (const [key, value] of url.searchParams) {
    if (key === 'select') continue;
    if (key === 'order') {
      order = value
        .split(',')
        .map((o) => {
          const [col, dir, nulls] = o.split('.');
          return `t.${ident(col)} ${dir === 'desc' ? 'desc' : 'asc'}${nulls === 'nullslast' ? ' nulls last' : nulls === 'nullsfirst' ? ' nulls first' : ''}`;
        })
        .join(', ');
    } else if (key === 'limit') limit = ` limit ${Number(value)}`;
    else if (key === 'offset') offset = ` offset ${Number(value)}`;
    else if (key === 'or') {
      const items = value.replace(/^\(|\)$/g, '').split(',');
      where.push(
        `(${items
          .map((it) => {
            const i = it.indexOf('.');
            return condition(it.slice(0, i), it.slice(i + 1), params);
          })
          .join(' or ')})`,
      );
    } else where.push(condition(key, value, params));
  }
  const cols = parseSelect(url.searchParams.get('select'), table).join(', ');
  const whereSql = where.length ? ` where ${where.join(' and ')}` : '';
  return {
    sql: `select ${cols} from public.${ident(table)} t${whereSql}${order ? ` order by ${order}` : ''}${limit}${offset}`,
    countSql: `select count(*)::int as n from public.${ident(table)} t${whereSql}`,
    params,
  };
}

async function asAnon(fn) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role anon');
    return fn(tx);
  });
}

// ------------------------------------------------------------------ Mock Supabase Auth (/auth/v1)
// Jetons en mémoire : access_token → uid. Un Bearer présent dans la map donne le rôle
// `authenticated` + le claim `request.jwt.claim.sub` (auth.uid() réel des policies).
const accessTokens = new Map(); // token → uid
const refreshTokens = new Map(); // refresh → uid

const userObj = (uid, email) => ({
  id: uid,
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  is_anonymous: false,
});

const emailOf = (uid) => Object.entries(E2E_ACCOUNTS).find(([, a]) => a.uid === uid)?.[0];

function issueTokens(uid) {
  const at = `e2e-at-${crypto.randomUUID()}`;
  const rt = `e2e-rt-${crypto.randomUUID()}`;
  accessTokens.set(at, uid);
  refreshTokens.set(rt, uid);
  return {
    access_token: at,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: rt,
    user: userObj(uid, emailOf(uid)),
  };
}

const bearerUid = (req) => {
  const m = (req.headers.authorization ?? '').match(/^Bearer (.+)$/);
  return m ? (accessTokens.get(m[1]) ?? null) : null;
};

/** Rôle SQL selon le Bearer : authentifié (+ claim sub) ou anon par défaut. */
async function asRequester(req, fn) {
  const uid = bearerUid(req);
  return db.transaction(async (tx) => {
    if (uid) {
      await tx.exec('set local role authenticated');
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
    } else {
      await tx.exec('set local role anon');
    }
    return fn(tx);
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

async function handleAuth(req, res, send, url) {
  const path = url.pathname.replace('/auth/v1', '');
  if (path === '/token' && req.method === 'POST') {
    const grant = url.searchParams.get('grant_type');
    const body = await readBody(req);
    if (grant === 'password') {
      const acc = E2E_ACCOUNTS[body.email];
      if (!acc || acc.password !== body.password) {
        return send(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      }
      return send(200, issueTokens(acc.uid));
    }
    if (grant === 'refresh_token') {
      const uid = refreshTokens.get(body.refresh_token);
      if (!uid) return send(400, { error: 'invalid_grant', error_description: 'Invalid refresh token' });
      return send(200, issueTokens(uid));
    }
    return send(400, { error: 'unsupported_grant_type' });
  }
  if (path === '/user' && req.method === 'GET') {
    const uid = bearerUid(req);
    if (!uid) return send(403, { message: 'invalid token', code: 403, error: 'bad_jwt' });
    return send(200, userObj(uid, emailOf(uid)));
  }
  if (path === '/logout' && req.method === 'POST') {
    const m = (req.headers.authorization ?? '').match(/^Bearer (.+)$/);
    if (m) {
      accessTokens.delete(m[1]);
      for (const [rt, uid] of refreshTokens) if (uid === bearerUid(req)) refreshTokens.delete(rt);
    }
    return send(204);
  }
  return send(404, { message: 'not found' });
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'access-control-expose-headers': 'content-range',
};

// ------------------------------------------------------------------ Mock de l'Edge Function
// Rejoue `supabase/functions/submit-request` : honeypot, validation minimale,
// INSERT en superuser (= service_role, le trigger anti-spam reste actif),
// URLs d'upload signées simulées, trace `email_notification_error`.
const FUNCTION_TABLES = {
  contact_messages: ['type', 'full_name', 'email', 'subject', 'message', 'consent'],
  gym_registration_requests: ['full_name', 'email', 'consent'],
  booking_requests: ['organizer_name', 'email', 'event_name', 'message', 'consent'],
  sponsorship_requests: ['company_name', 'contact_name', 'email', 'presentation', 'consent'],
};
const FILE_COLUMNS = { logo: 'logo_path', attachment: 'attachment_path' };
const MIME_EXT = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

async function handleFunction(req, res, send) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    return send(400, { ok: false, error: 'validation' });
  }
  const { table, data = {}, files = [] } = body;
  const required = FUNCTION_TABLES[table];
  if (!required || typeof data !== 'object') return send(400, { ok: false, error: 'validation' });
  if (typeof data.website === 'string' && data.website.length > 0) return send(200, { ok: true });
  const valid =
    required.every((k) => data[k] !== undefined && data[k] !== null && data[k] !== '') &&
    data.consent === true &&
    typeof data.email === 'string' &&
    data.email.includes('@') &&
    files.length <= 2 &&
    files.every((f) => FILE_COLUMNS[f.field] && MIME_EXT[f.type] && f.size <= 10 * 1024 * 1024);
  if (!valid) return send(400, { ok: false, error: 'validation' });

  const { website: _w, consent: _c, ...rest } = data;
  const row = { ...rest, consent: true };
  const keys = Object.keys(row);
  const { rows } = await db.query(
    `insert into public.${ident(table)} (${keys.map(ident).join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
    keys.map((k) => row[k]),
  );
  const id = rows[0].id;

  const uploads = {};
  const pathUpdates = [];
  for (const f of files) {
    const path = `${table}/${id}/${f.field}.${MIME_EXT[f.type]}`;
    uploads[f.field] = { path, token: 'e2e-signed-token' };
    pathUpdates.push(`${ident(FILE_COLUMNS[f.field])} = '${path.replaceAll("'", "''")}'`);
  }
  pathUpdates.push(`email_notification_error = 'not_configured'`);
  await db.query(`update public.${ident(table)} set ${pathUpdates.join(', ')} where id = '${id}'`);
  return send(200, { ok: true, id, uploads });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${API_PORT}`);
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...cors, ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return send(204);

  // Supabase Auth simulé.
  if (url.pathname.startsWith('/auth/v1/')) {
    try {
      return await handleAuth(req, res, send, url);
    } catch (e) {
      console.error(`[mock-auth] → ${e.message ?? e}`);
      return send(500, { message: String(e) });
    }
  }

  // Edge Function `submit-request` simulée.
  if (url.pathname === '/functions/v1/submit-request' && req.method === 'POST') {
    try {
      return await handleFunction(req, res, send);
    } catch (e) {
      const message = e.message ?? String(e);
      console.error(`[mock-fn] → ${message}`);
      return send(message.includes('RATE_LIMITED') ? 429 : 500, { ok: false, error: message.includes('RATE_LIMITED') ? 'rate_limited' : 'internal' });
    }
  }

  // Objets publics simulés : GET /storage/v1/object/public/<bucket>/<path>
  // → sert public/<bucket>/<path> (miroir local du bucket Supabase).
  const pubMatch = url.pathname.match(/^\/storage\/v1\/object\/public\/(\w+)\/(.+)/);
  if (pubMatch && req.method === 'GET') {
    const rel = decodeURIComponent(pubMatch[2]).replace(/\.\./g, '');
    const file = new URL(`../public/${pubMatch[1]}/${rel}`, import.meta.url);
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': guessMime(rel) });
      return res.end(data);
    } catch {
      return send(404, { message: 'object not found' });
    }
  }

  // Upload signé simulé : POST/PUT /storage/v1/object/upload/sign/attachments/<path>?token=…
  const uploadMatch = url.pathname.match(/^\/storage\/v1\/object\/upload\/sign\/attachments\/.+/);
  if (uploadMatch && (req.method === 'POST' || req.method === 'PUT')) {
    if (!url.searchParams.get('token')) return send(403, { message: 'missing token' });
    for await (const _ of req) void _; // consomme le corps du fichier
    return send(200, { Key: decodeURIComponent(url.pathname.replace('/storage/v1/object/upload/sign/', '')) });
  }

  const match = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
  if (!match) return send(404, { message: 'not found' });
  const table = match[1];
  const wantsRepresentation = /return=representation/.test(req.headers.prefer ?? '');
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const q = buildQuery(table, url);
      const { rows, total } = await asRequester(req, async (tx) => ({
        rows: req.method === 'HEAD' ? [] : (await tx.query(q.sql, q.params)).rows,
        total: /count=exact/.test(req.headers.prefer ?? '') ? (await tx.query(q.countSql, q.params)).rows[0].n : undefined,
      }));
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const range = req.method === 'HEAD' ? `*/${total ?? '*'}` : `${rows.length ? `${offset}-${offset + rows.length - 1}` : '*'}/${total ?? '*'}`;
      if (req.method === 'HEAD') return send(200, undefined, { 'content-range': range });
      if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (rows.length !== 1) return send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(200, rows[0], { 'content-range': range });
      }
      return send(200, rows, { 'content-range': range });
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const inputRows = Array.isArray(body) ? body : [body];
      const returning = wantsRepresentation ? ` returning ${parseSelect(url.searchParams.get('select') ?? '*', table).join(', ')}` : '';
      const inserted = await asRequester(req, async (tx) => {
        const out = [];
        for (const row of inputRows) {
          const keys = Object.keys(row);
          const values = keys.map((k) => row[k]);
          const r = await tx.query(
            `insert into public.${ident(table)} as t (${keys.map(ident).join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')})${returning}`,
            values,
          );
          out.push(...r.rows);
        }
        return out;
      });
      if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (inserted.length !== 1) return send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(201, inserted[0]);
      }
      return send(201, wantsRepresentation ? inserted : undefined);
    }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const params = [];
      const keys = Object.keys(body);
      // Params du SET d'abord (ordre d'apparition dans le SQL), puis les conditions.
      const setSql = keys.map((k) => `${ident(k)} = ${params.push(body[k]), `$${params.length}`}`).join(', ');
      const where = [];
      for (const [key, value] of url.searchParams) {
        if (key === 'select') continue;
        where.push(condition(key, value, params));
      }
      const returning = wantsRepresentation ? ` returning ${parseSelect(url.searchParams.get('select') ?? '*', table).join(', ')}` : '';
      const updated = await asRequester(req, async (tx) => {
        const r = await tx.query(
          `update public.${ident(table)} as t set ${setSql}${where.length ? ` where ${where.join(' and ')}` : ''}${returning}`,
          params,
        );
        return r.rows;
      });
      if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (updated.length !== 1) return send(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return send(200, updated[0]);
      }
      return send(200, wantsRepresentation ? updated : undefined);
    }
    if (req.method === 'DELETE') {
      const params = [];
      const where = [];
      for (const [key, value] of url.searchParams) {
        if (key === 'select') continue;
        where.push(condition(key, value, params));
      }
      await asRequester(req, (tx) =>
        tx.query(`delete from public.${ident(table)} as t${where.length ? ` where ${where.join(' and ')}` : ''}`, params),
      );
      return send(204);
    }
    return send(405, { message: 'method not allowed' });
  } catch (e) {
    const message = e.message ?? String(e);
    console.error(`[mock-api] ${req.method} ${url.pathname}${url.search} → ${message}`);
    return send(message.includes('permission denied') ? 401 : 400, { code: e.code ?? 'MOCK', message, details: null, hint: null });
  }
}).listen(API_PORT, () => console.log(`[mock-api] PostgREST de test (PGlite + RLS anon) sur http://localhost:${API_PORT}`));

if (!process.argv.includes('--api-only')) {
  const vite = spawn('npx', ['vite', '--port', '5175', '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: `http://localhost:${API_PORT}`,
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      VITE_SUBMIT_FUNCTION: 'true',
    },
  });
  process.on('SIGINT', () => {
    vite.kill();
    process.exit(0);
  });
}
