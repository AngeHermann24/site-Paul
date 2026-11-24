# AGENTS.md — PAUL Official

- Lire `docs/PROGRESS.md` au début de chaque session (état des phases, décisions).
- Shell : utiliser Git Bash (PowerShell bloque `npm.ps1`).
- Vérification : `npm run typecheck`, `npm run build`, `npm test`, `npm run db:test`, puis `npm run dev` + `npm run smoke` (Edge/Chrome local via playwright-core).
- E2E formulaires : `npm run dev:e2e` (mock API + Edge Function simulée, :5175) puis `node scripts/test-form.mjs` (contact) et `node scripts/test-forms.mjs` (gym/booking/sponsors).
- E2E back-office : `node scripts/test-admin.mjs` (mock auth `admin@e2e.local`/`e2e-pass` — login, guard, dashboard, inbox, CRUD, réglages).
- Tests composants : jsdom + helper maison `src/test/render.tsx` (`mount`/`click`/`keydown`/`setValue`, `act` natif) — pragma `// @vitest-environment jsdom` en tête de fichier, pas de Testing Library.
- Audit a11y : `npm run a11y` (24 routes : h1, ordre titres, alt, labels, cibles ≥24 px) · `npm run sitemap` régénère `public/sitemap.xml` (lit `VITE_SITE_URL`).
- Après toute modification SQL : `npm run db:test` puis `npm run db:types`, et répercuter les CHECK dans `src/types/domain.ts`. Nouvelle table = grants explicites + RLS.
- Accès données uniquement via `src/services/*` (jamais de `supabase.from` dans les composants).
- CSS Modules uniquement, classes en camelCase sans chiffre (`localsConvention: camelCaseOnly`).
- Ne pas committer : l'utilisateur committe lui-même.
- Framer Motion : `LazyMotion strict` → utiliser `m.*`, jamais `motion.*`.
- GSAP uniquement via `src/utils/gsap.ts` (`loadGsap`/`getGsap`) et `useGsap` ; Framer Motion jamais sur les mêmes éléments.
- Ne jamais inventer de contenu (stats, palmarès, sponsors…) : état vide + champ admin.
- Formulaires : primitives dans `src/features/forms/` ; schémas dans `src/schemas/requests.ts` (miroir serveur snake_case : `supabase/functions/_shared/request-schemas.ts` — modifier les deux ensemble). Jamais de `service_role` côté frontend.
