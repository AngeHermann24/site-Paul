/**
 * Test exécutable des migrations Supabase + RLS, dans PGlite (Postgres WASM, en mémoire).
 * Usage : npm run db:test
 *
 * Applique : supabase/tests/supabase_shim.sql → supabase/migrations/*.sql (ordre) → supabase/seed.sql
 * puis vérifie les droits de chaque rôle (anon, utilisateur connecté non admin, editor, owner).
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

const db = new PGlite();
let failures = 0;
let passes = 0;

const ok = (cond, label, extra = '') => {
  if (cond) passes += 1;
  else failures += 1;
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${!cond && extra ? `\n       → ${extra}` : ''}`);
};

/** Exécute une requête sous un rôle + identité JWT, dans une transaction isolée. */
async function as(role, uid, sql, params = []) {
  try {
    const res = await db.transaction(async (tx) => {
      await tx.exec(`set local role ${role}`);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
      return tx.query(sql, params);
    });
    return { rows: res.rows, affected: res.affectedRows ?? 0, error: null };
  } catch (e) {
    return { rows: [], affected: 0, error: e.message };
  }
}

// ---------------------------------------------------------------- setup
await db.exec(read('supabase/tests/supabase_shim.sql'));
const migrations = readdirSync(join(root, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
for (const file of migrations) {
  try {
    await db.exec(read(`supabase/migrations/${file}`));
    ok(true, `migration ${file}`);
  } catch (e) {
    ok(false, `migration ${file}`, e.message);
    process.exit(1);
  }
}
try {
  await db.exec(read('supabase/seed.sql'));
  ok(true, 'seed.sql (DEMO)');
} catch (e) {
  ok(false, 'seed.sql (DEMO)', e.message);
  process.exit(1);
}

const users = Object.fromEntries(
  (
    await db.query(
      `insert into auth.users (email) values ('owner@test.dev'), ('editor@test.dev'), ('fan@test.dev'), ('ex@test.dev')
       returning id, email`,
    )
  ).rows.map((r) => [r.email.split('@')[0], r.id]),
);
await db.query(
  `insert into public.admin_users (user_id, email, role, is_active) values
   ($1, 'owner@test.dev', 'owner', true), ($2, 'editor@test.dev', 'editor', true), ($3, 'ex@test.dev', 'admin', false)`,
  [users.owner, users.editor, users.ex],
);
const OWNER = users.owner;
const EDITOR = users.editor;
const FAN = users.fan;
const EX = users.ex;

// ---------------------------------------------------------------- structure
const rls = await db.query(
  `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' order by 1`,
);
ok(rls.rows.length === 20, `20 tables dans public (trouvé ${rls.rows.length})`);
ok(rls.rows.every((r) => r.relrowsecurity), 'RLS activée sur toutes les tables', rls.rows.filter((r) => !r.relrowsecurity).map((r) => r.relname).join(', '));

const definer = await db.query(
  `select p.proname, p.prosecdef, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('is_admin', 'is_owner', 'guard_public_request')`,
);
ok(
  definer.rows.length === 3 && definer.rows.every((r) => r.prosecdef && (r.proconfig ?? []).some((c) => c.startsWith('search_path='))),
  'is_admin / is_owner / guard_public_request : SECURITY DEFINER + search_path fixé',
);

const buckets = await db.query(`select id, public, file_size_limit from storage.buckets order by id`);
ok(
  JSON.stringify(buckets.rows.map((b) => [b.id, b.public])) === JSON.stringify([['attachments', false], ['logos', true], ['media', true]]),
  'buckets : attachments (privé), logos & media (publics)',
);
ok(buckets.rows.every((b) => Number(b.file_size_limit) > 0), 'buckets : limite de taille définie');

// ---------------------------------------------------------------- is_admin()
ok((await as('anon', null, 'select public.is_admin() as v')).rows[0]?.v === false, 'is_admin() = false pour anon');
ok((await as('authenticated', FAN, 'select public.is_admin() as v')).rows[0]?.v === false, 'is_admin() = false pour un utilisateur non admin');
ok((await as('authenticated', EDITOR, 'select public.is_admin() as v')).rows[0]?.v === true, 'is_admin() = true pour un editor actif');
ok((await as('authenticated', EX, 'select public.is_admin() as v')).rows[0]?.v === false, 'is_admin() = false pour un admin désactivé');

// ---------------------------------------------------------------- lecture publique
const anonFights = await as('anon', null, 'select slug, status from public.fights');
ok(!anonFights.error && anonFights.rows.length === 4 && anonFights.rows.every((r) => r.status === 'published'), 'anon : voit uniquement les combats publiés (4/5)', anonFights.error ?? JSON.stringify(anonFights.rows));
const adminFights = await as('authenticated', EDITOR, 'select slug from public.fights');
ok(adminFights.rows.length === 5, 'admin : voit aussi les brouillons (5/5)');
const anonArticles = await as('anon', null, `select slug from public.articles`);
ok(anonArticles.rows.length === 1, 'anon : article brouillon invisible');

const stats = await as('anon', null, `select * from public.fight_stats where category = 'professional'`);
const s = stats.rows[0];
ok(
  s && Number(s.total) === 3 && Number(s.wins) === 2 && Number(s.draws) === 1 && Number(s.losses) === 0 && Number(s.ko_wins) === 1,
  'fight_stats calculé depuis les combats publiés (3 combats : 2V 0D 1N, 1 KO)',
  stats.error ?? JSON.stringify(s),
);
const amateurStats = await as('authenticated', OWNER, `select * from public.fight_stats where category = 'amateur'`);
ok(amateurStats.rows.length === 0, 'fight_stats ignore les brouillons même pour un admin');

const sponsorsAnon = await as('anon', null, 'select slug from public.sponsors order by sort_order');
ok(sponsorsAnon.rows.map((r) => r.slug).join() === 'demo-marque-a,demo-marque-b', 'anon : sponsors inactifs masqués');
const settings = await as('anon', null, 'select site_name from public.site_settings');
ok(settings.rows.length === 1, 'anon : site_settings lisible (ligne unique)');

// ---------------------------------------------------------------- écriture contenu
const anonWrite = await as('anon', null, `insert into public.fights (slug, opponent_name, event_date, fight_status) values ('x', 'X', now(), 'scheduled')`);
ok(Boolean(anonWrite.error), 'anon : INSERT combat refusé', anonWrite.error ?? 'aucune erreur');
const fanWrite = await as('authenticated', FAN, `insert into public.fights (slug, opponent_name, event_date, fight_status) values ('x', 'X', now(), 'scheduled')`);
ok(Boolean(fanWrite.error), 'utilisateur non admin : INSERT combat refusé (RLS)', fanWrite.error ?? 'aucune erreur');
const fanUpdate = await as('authenticated', FAN, `update public.fights set opponent_name = 'Hack' returning id`);
ok(!fanUpdate.error && fanUpdate.rows.length === 0, 'utilisateur non admin : UPDATE combat sans effet');
const anonDelete = await as('anon', null, `delete from public.articles`);
ok(Boolean(anonDelete.error), 'anon : DELETE article refusé');
const editorWrite = await as(
  'authenticated',
  EDITOR,
  `insert into public.fights (slug, opponent_name, event_date, fight_status) values ('test-admin', 'Test', now(), 'scheduled') returning created_by`,
);
ok(!editorWrite.error && editorWrite.rows[0]?.created_by === EDITOR, 'editor : INSERT combat autorisé, created_by renseigné', editorWrite.error ?? '');
const settingsUpdate = await as('authenticated', FAN, `update public.site_settings set site_name = 'Hack' returning id`);
ok(settingsUpdate.rows.length === 0, 'utilisateur non admin : site_settings non modifiable');

// ---------------------------------------------------------------- contraintes métier
const badFight = await as('authenticated', OWNER, `insert into public.fights (slug, opponent_name, event_date, fight_status) values ('bad', 'Bad', now(), 'completed')`);
ok(Boolean(badFight.error), 'CHECK : combat terminé sans résultat refusé');
const badSlug = await as('authenticated', OWNER, `insert into public.fights (slug, opponent_name, event_date, fight_status) values ('Bad Slug', 'B', now(), 'scheduled')`);
ok(Boolean(badSlug.error), 'CHECK : slug invalide refusé');
const unilingual = await as(
  'authenticated',
  OWNER,
  `insert into public.articles (slug, title_fr, title_en, body_fr, status, published_at) values ('mono', 'FR', 'EN', 'corps', 'published', now())`,
);
ok(Boolean(unilingual.error), 'CHECK : article publié sans version EN refusé');

// ---------------------------------------------------------------- formulaires publics
const contact = (email, extra = '') =>
  as(
    'anon',
    null,
    `insert into public.contact_messages (type, full_name, email, subject, message, consent${extra ? ', status, internal_notes' : ''})
     values ('media', 'Jean Test', $1, 'Sujet', 'Message suffisamment long', true${extra})`,
    [email],
  );
const c1 = await contact('Fan@Example.com');
ok(!c1.error, 'anon : INSERT contact_messages autorisé', c1.error ?? '');
const forged = await contact('forge@example.com', `, 'accepted', 'note pirate'`);
const forgedRow = (await db.query(`select status, internal_notes from public.contact_messages where email = 'forge@example.com'`)).rows[0];
ok(!forged.error && forgedRow?.status === 'new' && forgedRow?.internal_notes === null, 'anon : statut et notes internes forcés (new / null)', forged.error ?? JSON.stringify(forgedRow));
const normalized = (await db.query(`select email from public.contact_messages where email = 'fan@example.com'`)).rows.length;
ok(normalized === 1, 'email normalisé en minuscules');
const anonRead = await as('anon', null, 'select * from public.contact_messages');
ok(Boolean(anonRead.error) || anonRead.rows.length === 0, 'anon : SELECT contact_messages impossible');
const fanRead = await as('authenticated', FAN, 'select * from public.contact_messages');
ok(!fanRead.error && fanRead.rows.length === 0, 'utilisateur non admin : aucune demande visible');
const adminRead = await as('authenticated', EDITOR, 'select * from public.contact_messages');
ok(adminRead.rows.length === 2, 'admin : lit les demandes');
const adminUpdate = await as('authenticated', EDITOR, `update public.contact_messages set status = 'in_review', internal_notes = 'Rappeler' returning status`);
ok(adminUpdate.rows.length === 2, 'admin : change le statut / ajoute des notes internes');

await contact('spam@example.com');
await contact('spam@example.com');
const third = await contact('spam@example.com');
const fourth = await contact('spam@example.com');
ok(!third.error && Boolean(fourth.error) && fourth.error.includes('RATE_LIMITED'), 'anti-spam : 4e envoi en 10 min refusé (RATE_LIMITED)', fourth.error ?? 'aucune erreur');

const sponsorship = await as(
  'anon',
  null,
  `insert into public.sponsorship_requests (company_name, contact_name, email, presentation, consent, activities)
   values ('ACME', 'Jane', 'jane@acme.test', 'Nous souhaitons un partenariat durable.', true, '{boxing,gym}')`,
);
ok(!sponsorship.error, 'anon : INSERT sponsorship_requests autorisé', sponsorship.error ?? '');
const noConsent = await as(
  'anon',
  null,
  `insert into public.booking_requests (organizer_name, email, event_name, message, consent) values ('Org', 'o@o.test', 'Gala', 'Bonjour, booking ?', false)`,
);
ok(Boolean(noConsent.error), 'CHECK : demande sans consentement refusée');

// ---------------------------------------------------------------- admin_users
const fanAdmins = await as('authenticated', FAN, 'select * from public.admin_users');
ok(fanAdmins.rows.length === 0, 'utilisateur non admin : admin_users invisible');
const editorSelf = await as('authenticated', EDITOR, 'select * from public.admin_users');
ok(editorSelf.rows.length === 3, 'admin : liste des admins visible');
const escalate = await as('authenticated', FAN, `insert into public.admin_users (user_id, email, role) values ($1, 'fan@test.dev', 'owner')`, [FAN]);
ok(Boolean(escalate.error), 'utilisateur non admin : auto-promotion refusée');
const editorPromote = await as('authenticated', EDITOR, `update public.admin_users set role = 'owner' where user_id = $1 returning id`, [EDITOR]);
ok(editorPromote.rows.length === 0, 'editor : ne peut pas se promouvoir owner');
const ownerManage = await as('authenticated', OWNER, `update public.admin_users set is_active = true where user_id = $1 returning id`, [EX]);
ok(ownerManage.rows.length === 1, 'owner : gère les administrateurs');
const lastOwner = await as('authenticated', OWNER, `update public.admin_users set role = 'admin' where user_id = $1`, [OWNER]);
ok(Boolean(lastOwner.error) && lastOwner.error.includes('LAST_OWNER'), 'le dernier owner ne peut pas se rétrograder');

// ---------------------------------------------------------------- storage
const anonUpload = await as('anon', null, `insert into storage.objects (bucket_id, name) values ('attachments', 'sponsorship-requests/x.pdf')`);
ok(Boolean(anonUpload.error), 'storage : upload anonyme refusé');
const fanUpload = await as('authenticated', FAN, `insert into storage.objects (bucket_id, name) values ('media', 'x.jpg')`);
ok(Boolean(fanUpload.error), 'storage : upload utilisateur non admin refusé');
const adminUpload = await as('authenticated', EDITOR, `insert into storage.objects (bucket_id, name) values ('media', 'fights/x.jpg')`);
ok(!adminUpload.error, 'storage : upload admin autorisé', adminUpload.error ?? '');
const anonList = await as('anon', null, `select * from storage.objects`);
ok(anonList.rows.length === 0, 'storage : listing anonyme vide');

// ---------------------------------------------------------------- recherche plein texte
const search = await as('anon', null, `select slug from public.articles where search_fr @@ websearch_to_tsquery('french', 'entraînements')`);
ok(search.rows.length === 1, 'recherche FR (stemming « entraînements » → article)', search.error ?? '');

// ---------------------------------------------------------------- updated_at
const before = (await db.query(`select updated_at from public.site_settings`)).rows[0].updated_at;
await new Promise((r) => setTimeout(r, 20));
await as('authenticated', OWNER, `update public.site_settings set site_name = 'PAUL'`);
const after = (await db.query(`select updated_at from public.site_settings`)).rows[0].updated_at;
ok(new Date(after) > new Date(before), 'trigger updated_at');

console.log(`\n${passes} ok, ${failures} échec(s)`);
await db.close();
process.exit(failures ? 1 : 0);
