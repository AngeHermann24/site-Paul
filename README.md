# PAUL — Site officiel

Plateforme digitale sportive premium : boxeur, Paul Gym, commentateur.
React 19 · Vite 8 · TypeScript strict · CSS Modules · GSAP · Supabase (PostgreSQL + Auth + Storage + Edge Functions).

## Démarrage rapide

```bash
npm install
npm run dev            # http://localhost:5173 — site sans données si Supabase non configuré
npm run dev:e2e        # http://localhost:5175 — site + mock API complète (auth, RLS, Edge Function simulée)
```

Sans clés Supabase, toutes les sections dynamiques affichent des états vides honnêtes.
Pour brancher un vrai projet : `docs/SETUP.md` (migrations, secrets, function, compte admin).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` / `dev:e2e` | dev / dev + mock API PostgREST+Auth (PGlite, RLS réelle) |
| `npm run build` / `preview` | build production `dist/` / prévisualisation |
| `npm run typecheck` | tsc strict |
| `npm test` | Vitest (schémas zod, services, helpers admin, composants jsdom) |
| `npm run db:test` | migrations + RLS rejouées dans PGlite — 54 checks |
| `npm run smoke` | toutes les routes FR/EN, desktop+mobile, erreurs console |
| `node scripts/test-form.mjs` / `test-forms.mjs` | E2E formulaires publics (anti-spam, Edge Function, uploads) |
| `node scripts/test-admin.mjs` | E2E back-office (login `admin@e2e.local`/`e2e-pass`, guard, CRUD, inbox) |
| `node scripts/a11y-check.mjs` | audit a11y maison (h1, ordre titres, alt, labels, cibles) |
| `npm run sitemap` | régénère `public/sitemap.xml` depuis `VITE_SITE_URL` + contenus publiés |

## Architecture

- `src/pages/` — pages publiques `/:lang/…` + back-office `/admin` (lazy par route).
- `src/features/` — `forms/` (infra partagée formulaires publics), `admin/` (kit UI + config des 15 ressources + auth).
- `src/services/` — couche typée Supabase ; `admin.ts` = CRUD générique (la **RLS est la seule sécurité**).
- `src/integrations/supabase/` — client lazy (clé **anon** uniquement) + types générés (`npm run db:types`).
- `supabase/migrations/` — schéma + RLS + storage + vues. `supabase/functions/submit-request/` — Edge Function (validation zod serveur, Turnstile, uploads signés, email Resend).
- `scripts/e2e-server.mjs` — mock test-only (PostgREST + Auth + Storage + Function sur PGlite). **Jamais de `service_role` côté frontend.**

## Déploiement

1. **Supabase** : créer le projet, appliquer `supabase/migrations/*` via `supabase db push`, créer les buckets selon la migration, déployer la function (`docs/SETUP.md` § 5 bis : `submit-request`, secrets `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`).
2. **Admin** : créer l'utilisateur dans Supabase Auth + insérer sa ligne `admin_users` (`role='owner'`, `is_active=true`).
3. **Frontend** : `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUBMIT_FUNCTION=true`, `VITE_TURNSTILE_SITE_KEY` → `npm run sitemap` → `npm run build` → servir `dist/` en statique (Vercel/Netlify/CDN) avec SPA fallback `/* → /index.html`.
4. **Vérifier** : `/fr`, `/en`, `/admin/login`, une soumission de formulaire réelle (arrive dans `/admin/demandes`).

Détail complet : `docs/SETUP.md`. État du projet : `docs/PROGRESS.md`.
