# PAUL — Official Boxing & Sports Experience · PROGRESS

> Mémoire du projet entre les sessions. À relire au début de chaque phase.
> Dernière mise à jour : Phase 7 terminée. **Projet complet — déploiement possible (voir README.md + docs/SETUP.md).**

## État des phases

| Phase | Statut | Résumé |
|---|---|---|
| 1 — Audit & fondations | ✅ terminée | Vite/React/TS strict, tokens, polices, composants de base, GSAP/Lenis centralisés, i18n, routing /fr /en, layout, menu |
| 2 — Signature motion | ✅ terminée | préloader, hero vidéo, transitions, curseur, magnétique, révélations, progress bar, grain |
| 3 — Supabase | ✅ terminée | 5 migrations, RLS 20 tables, buckets, anti-spam DB, types générés, services typés, SETUP.md, seed DEMO — testés dans PGlite (53 vérifications) |
| 4 — Pages publiques | ✅ terminée | 12 pages + 2 routes détail, composants signature, données DEMO via services, formulaire contact fonctionnel (RLS INSERT), états honnêtes sans clés |
| 5 — Formulaires | ✅ terminée | 4 formulaires production (contact, gym, booking, sponsoring 5 étapes), Edge Function `submit-request` écrite + simulée e2e, uploads signés, Turnstile optionnel |
| 6 — Back-office | ✅ terminée | `/admin` protégé (login + guard + denied), dashboard KPI, inbox 4 tables (statuts, notes, PJ signées), CRUD générique 14 ressources + profil + réglages + équipe (owner-only), mock auth e2e, 16 checks E2E |
| 7 — Qualité | ✅ terminée | tests jsdom (33 tests), a11y audit maison 24 routes + fixes réels, bundle initial −36 kB gzip (LazyMotion différé), robots+sitemap générateur, README déploiement |
| 7 — Qualité | ⏳ à faire | |

## Git
- Aucune identité Git configurée sur la machine. **Décision utilisateur : l'agent ne committe pas**, l'utilisateur committe lui-même à la fin de chaque phase. Le dépôt est initialisé (`main`, aucun commit).

## Audit initial (Phase 1)

- Workspace **vide** au démarrage (aucun code existant, aucune intégration Supabase). Projet créé de zéro.
- Environnement : Windows, Node 24.20, npm 11.19, git 2.55. PowerShell bloque `npm.ps1` → utiliser Git Bash (ou `npm.cmd`).
- Navigateurs locaux : Edge + Chrome (utilisés par `scripts/smoke.mjs` via `playwright-core`, aucun téléchargement).

## Décisions techniques

### Stack (versions épinglées, toutes publiées ≥ 7 jours avant installation)
- React 19.3.1, Vite 8.3.8 (rolldown), @vitejs/plugin-react 6.3.0, **TypeScript 7.0.2** (compilateur natif ; `tsc --noEmit` vérifié réellement actif).
- react-router 8.5.1 en mode déclaratif (`BrowserRouter` + `Routes`), lazy par route.
- gsap 3.15.1 (ScrollTrigger + SplitText, gratuits), lenis 1.3.27, framer-motion 14.14.0.
- i18next 27.1.1 + react-i18next 18.0.1, react-helmet-async 3.1.0, lucide-react 1.73.0.
- Installés pour les phases suivantes : zod 4.6.7, react-hook-form 7.92.0, @hookform/resolvers 7.0.6, @supabase/supabase-js 2.119.0.
- Polices @fontsource : Anton (titres), Inter Variable (texte), JetBrains Mono (HUD/labels).
- **CSS Modules uniquement** (pas de Tailwind). `localsConvention: 'camelCaseOnly'` → ⚠️ nommer les classes en camelCase **sans chiffre** (`size3xl` deviendrait `size3Xl`).

### Motion
- `src/utils/gsap.ts` : **seul** point d'entrée GSAP, chargé en lazy (`loadGsap()`), un seul `registerPlugin`. `getGsap()` permet une exécution synchrone si déjà chargé.
- `src/hooks/useGsap.ts` : `gsap.context()` scoppé + `ctx.revert()` automatique.
- `src/contexts/MotionContext.tsx` : Lenis (désactivé si reduced-motion) synchronisé sur `gsap.ticker` + `ScrollTrigger.update`, `scrollTo`, `setScrollLocked`, profil appareil (`isTouch`, `isMobile`, `constrainedNetwork`, `lowPower`, `richMotion`).
- Framer Motion : menu plein écran (clip-path circulaire depuis le bouton, stagger des liens). Jamais sur les éléments animés par GSAP.

### i18n & routing
- Routes `/:lang/<segment>` ; segments identiques FR/EN (`/fr/combats`, `/en/combats`) — définis dans `src/routes/paths.ts`.
- `/` → langue préférée (localStorage `paul.lang` → `navigator.language` → `fr`). Chemin sans préfixe (`/champion`) → `/fr/champion`.
- Langue initiale lue dans l'URL avant le premier rendu (pas de flash). `<html lang>`, canonical, hreflang (fr, en, x-default), og:locale via `<Seo>`.
- Traductions UI typées : `src/locales/fr/common.ts` est la source, `en` doit respecter le même type (erreur TS si clé manquante).
- **Contenus éditoriaux en base (décision pour la phase 3)** : colonnes `*_fr` / `*_en` (ex. `title_fr`, `title_en`) plutôt que JSONB — contraintes NOT NULL/CHECK par langue, index simples, types générés lisibles.

### Contenu
- Aucune donnée inventée. Les pages internes affichent un en-tête réel + un état « contenu en préparation » (`StubPage`) jusqu'à la phase 4.
- Le HUD « RD 01 / 00:00 » du hero est purement décoratif (aria-hidden).

## Structure

```
src/
  components/
    layout/   AppLayout, Header, MobileMenu, LanguageSwitcher, Logo, LegalZone, SkipLink, GridLines, navItems
    system/   ErrorBoundary, RouteFallback, Seo
    ui/       Button, Heading, Section, Container, Eyebrow, PageHero, EmptyState
  contexts/   MotionContext
  hooks/      useGsap, useReducedMotion, useMediaQuery, useDeviceProfile, useFocusTrap, useLang
  locales/    index.ts (init i18next), fr/common.ts, en/common.ts
  pages/      home, champion, fights, performance, gym, commentator, news, media, sponsors, contact, legal, notFound, StubPage
  routes/     AppRouter, LangLayout, RootRedirect, paths
  styles/     tokens.css, reset.css, global.css, fonts.ts
  types/      i18next.d.ts, navigator.d.ts
  utils/      gsap.ts, env.ts, cx.ts
scripts/smoke.mjs   smoke test navigateur (routes FR/EN, desktop 1440 + mobile 390)
scripts/motion-shots.mjs   captures d'animation
```
Ajouts phase 2 : `components/motion/*` (Preloader, PageCurtain, CustomCursor, Magnetic, ScrollProgress, Grain, ScrubText, RevealImage), `features/home/Hero`, `contexts/IntroContext`, `config/media.ts`, `utils/assetGate.ts`, `hooks/useRevealLines.ts`.
Dossiers prévus à créer dans les phases suivantes : `features/`, `services/`, `integrations/supabase/`, `assets/`, `supabase/migrations/`.

## Comment tester

```bash
npm install
npm run typecheck
npm run build
npm run dev            # http://localhost:5173
npm run smoke          # (serveur lancé) — REDUCED=1 npm run smoke pour reduced-motion
npm run db:test        # migrations + RLS dans PGlite
npm test               # Vitest (services)
npm run db:types       # régénère database.types.ts
node scripts/motion-shots.mjs                          # captures animations desktop
node scripts/motion-shots.mjs http://localhost:5173 mobile
```
Pour revoir le préloader dans un navigateur : nouvel onglet privé, ou `sessionStorage.removeItem('paul.intro-seen')` puis recharger.

## Résultats Phase 1
- `npm run typecheck` ✅ · `npm run build` ✅
- Smoke : 14 routes × FR/EN × desktop/mobile → 0 erreur console, 0 overflow horizontal, `<html lang>` correct, h1 présent ; 404 stylée ; switch de langue conserve la page ; focus piégé dans le menu mobile ; redirections racine OK.

## Phase 2 — Signature motion (fait)

| Recette | Fichier(s) | Notes |
|---|---|---|
| Préloader chronomètre | `components/motion/Preloader` + `utils/assetGate.ts` | Compteur mono tabulaire 00→100 piloté par la **progression réelle** (polices critiques, chunk GSAP, montage de la page, poster/vidéo hero si configurés), plafonné par une durée min de 1,2 s (aucun délai ajouté au-delà), plafond dur 9 s, chaque tâche plafonnée. Flash blanc→rouge, rideau 2 panneaux `clip-path`. 1×/session (`sessionStorage paul.intro-seen`), bouton « Passer l'intro » + Échap. Désactivé en reduced-motion. |
| Hero | `features/home/Hero` | Vidéo (`autoPlay muted loop playsInline preload=metadata`, poster), source mobile dédiée, poster seul si `saveData`/réseau lent/reduced-motion, pause hors écran (IntersectionObserver). Overlay progressif + vignette, lumière rouge suivant la souris (transform via `quickTo`, desktop), PAUL lettre par lettre (masque + yPercent, stagger), rôles, slogan, CTA, indicateur de scroll (bouton → section suivante), parallax souris 2 couches, sortie au scroll (scrub). HUD chronomètre de round décoratif. État initial caché en CSS (`data-phase="pending"`) + filet de sécurité temporisé → jamais de contenu bloqué. |
| Transitions de page | `components/motion/PageCurtain` + `AppLayout` | Framer Motion `useAnimate` : rouge puis noir balayent l'écran avec le nom de la page (~650 ms), ancienne page gelée pendant le rideau (`useOutlet`), puis scroll en haut immédiat, focus sur `<main>`, attente du montage réel de la page (lazy) avant découverte, `ScrollTrigger.refresh()`. Aucun rideau pour un simple changement de langue. Reduced-motion : bascule directe. |
| Curseur custom | `components/motion/CustomCursor` | Cercle + point (`quickTo`), grossit sur liens/boutons/`[data-cursor]`, `data-cursor="play"` → libellé PLAY, masqué sur champs texte, `aria-hidden`. Monté seulement si pointeur fin et pas de reduced-motion. |
| Boutons magnétiques | `components/motion/Magnetic/useMagnetic.ts` | Délégation globale sur `[data-magnetic]` (posé par `Button`), amplitude ≤ 12 px, retour élastique. |
| Titres | `hooks/useRevealLines.ts` | Tous les `[data-reveal="lines"]` (posés par `Heading`) : lignes 110 % → 0 dans leur masque, `once`. Reduced : fondu. |
| Paragraphe mot à mot | `components/motion/ScrubText` | Opacité 0.15 → 1 en scrub. **Utilisé une seule fois** (manifeste de l'accueil ; en phase 4 : présentation de Paul). |
| Images | `components/motion/RevealImage` | `clip-path: inset()` + zoom inversé 1.25 → 1, parallax interne 2 profondeurs (image / légende), ratio réservé (0 CLS), placeholder sombre soigné si pas de `src`. |
| Progression de scroll | `components/motion/ScrollProgress` | Barre rouge 2 px, `scaleX` via rAF. |
| Grain | `components/motion/Grain` | SVG feTurbulence, steps(6), opacité 0.075 ; désactivé en reduced-motion, mobile et appareils faibles. |
| Menu mobile | (phase 1) `components/layout/MobileMenu` | Passé en `m.*` (LazyMotion). |

Autres décisions phase 2 :
- `LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"` dans `App.tsx` → utiliser **`m.*`**, jamais `motion.*` (erreur en mode strict).
- SplitText retiré : le découpage lettres/lignes/mots est fait en React (markup accessible, `sr-only` pour le titre du hero).
- ⚠️ Piège GSAP : si un état initial CSS utilise `transform: translateY(%)`, GSAP le relit comme `y` en px → toujours passer `y: 0` dans le `from` quand on anime `yPercent`.
- ⚠️ Piège Git Bash : une variable d'env `/media/...` passée en ligne de commande est convertie en chemin Windows. Utiliser `.env.local`.
- Médias hero configurés via `VITE_HERO_VIDEO_MP4`, `VITE_HERO_VIDEO_WEBM`, `VITE_HERO_VIDEO_MOBILE_MP4`, `VITE_HERO_POSTER` (`src/config/media.ts`). **Aucun asset fourni pour l'instant** → placeholder cinématique. Chemin vidéo testé avec une vidéo WebM générée (lecture, pause hors écran, 0 erreur) puis supprimée.

Résultats phase 2 :
- `npm run typecheck` ✅ · `npm run build` ✅ (JS initial ≈ 125 kB gzip + chunk partagé 35 kB ; GSAP 45 kB et Lenis 5 kB en lazy).
- `npm run smoke` ✅ et `REDUCED=1 npm run smoke` ✅ (56 pages, 0 erreur console, 0 overflow, focus menu, switch langue).
- `node scripts/motion-shots.mjs [url] [mobile]` : captures préloader / hero / scroll / rideau dans `.artifacts/motion/` — vérifié desktop 1440 et mobile 390 (après transition : `scrollY 0`, focus `main`).

## Phase 3 — Supabase (fait)

Livrables :
- `supabase/migrations/` (ordre) : `0100_foundation` (admin_users, `is_admin()`, `is_owner()`, garde dernier owner), `0200_content` (15 tables + vue `fight_stats` + ligne `site_settings`), `0300_requests` (4 tables de demandes + trigger `guard_public_request`), `0400_rls`, `0500_storage`.
- `supabase/seed.sql` : DEMO uniquement (`is_demo = true`, libellés `[DEMO]`, rien sur Paul). `supabase/scripts/create_first_admin.sql`, `supabase/scripts/purge_demo.sql`.
- `supabase/tests/supabase_shim.sql` : rôles anon/authenticated/service_role, `auth.uid()`, `storage.*` — **test uniquement**.
- `src/integrations/supabase/client.ts` (client lazy, clé anon, `publicStorageUrl`), `database.types.ts` (généré).
- `src/services/` : `_shared` (ServiceResult, erreurs typées, filtre DEMO, `pick` FR/EN), `fights`, `profile`, `settings`, `editorial` (palmarès, performance, gym, commentateur), `media`, `articles`, `sponsors`, `requests`. `src/hooks/useServiceQuery.ts`. `src/types/domain.ts` (miroir des CHECK).
- `docs/SETUP.md` : création projet, variables, migrations (CLI ou SQL Editor), premier admin, modèle de sécurité.

Décisions :
- **Bilingue** : colonnes `*_fr`/`*_en`. Contraintes « bilingual_when_published » : un texte présent dans une seule langue empêche la publication. Titres obligatoires dans les deux langues.
- **Statuts** : contenus `draft|published|archived` ; demandes `new|in_review|contacted|accepted|rejected|archived`. Domaines en `text + CHECK` (pas d'enum Postgres).
- **Pas de `FORCE ROW LEVEL SECURITY`** : sinon `is_admin()` (SECURITY DEFINER) repasserait par la policy de `admin_users` → récursion.
- **Privilèges** : `revoke all` puis grants explicites (anon : SELECT contenus, INSERT demandes). ⚠️ Toute nouvelle table devra recevoir ses grants explicitement dans sa migration.
- **Anti-spam base** : trigger force `status='new'`, vide les champs internes, normalise l'email, limite 3 envois / 10 min / email et 30 / min / table. Honeypot, délai mini et Turnstile → Edge Function (phase 5).
- **Storage** : `media` (public, 50 Mo), `logos` (public, 2 Mo, SVG admin seulement), `attachments` (privé, 10 Mo). Aucune policy anon : upload public via URL signée de l'Edge Function (phase 5).
- **DEMO** : colonne `is_demo` sur les contenus ; `services/` filtre `is_demo=false` en production (`import.meta.env.PROD`, sauf `VITE_ALLOW_DEMO_CONTENT=true`). `fight_stats` groupé par `is_demo`.
- **Stats de combat** : uniquement via la vue `fight_stats` (security_invoker) — jamais de valeur en dur.
- **Recherche articles** : colonnes générées `search_fr` (config french) / `search_en` + index GIN ; `textSearch(..., websearch)`.
- **Types** : `npm run db:types` régénère depuis les migrations via PGlite (pas besoin de projet). Le `run()` de `_shared` nécessite parfois un type explicite (`run<Tables<'articles'>>`) : l'inférence générique peut dériver vers `never`.
- **Sans clés** : `getSupabase()` renvoie `null` → services renvoient `{ error: { kind: 'not_configured' } }`, aucun appel réseau, aucune donnée simulée (testé).

Vérifications phase 3 :
- `npm run db:test` ✅ 53/53 (migrations + seed exécutés ; RLS par rôle : anon, connecté non admin, editor, admin désactivé, owner ; contraintes ; anti-spam ; storage ; recherche FR ; updated_at).
- `npm test` ✅ 8/8 (Vitest) : requêtes PostgREST réellement générées par supabase-js (filtres, tri, `or` assaini, recherche `wfts(french)`, pagination offset/limit, INSERT sans `select`, mapping `RATE_LIMITED`), mode non configuré sans appel réseau.
- `npm run typecheck` ✅ · `npm run build` ✅ · `npm run smoke` ✅.
- ⚠️ **Non testé contre un vrai projet Supabase** (aucune clé fournie). À faire dès que `.env.local` est rempli : appliquer les migrations, créer l'owner, vérifier un brouillon invisible en anon.

## Phase 4 — Pages publiques (fait)

Pages réelles remplaçant les stubs (toutes lazy, `Seo` par page, `useServiceQuery` + `DataState`) :
- **Accueil** (`pages/home`) : hero, manifeste (ScrubText), 3 activités, stats (`fight_stats`), dernier/prochain combat, carrière, gym, commentateur, vidéo featured (embed différé, aucun cookie tiers avant clic), actus, CTA sponsors.
- **Champion** : profil + portrait, palmarès (`achievements`), timeline carrière épinglée horizontale (desktop ; verticale mobile/reduced), galerie.
- **Combats** : bilan `fight_stats` (jamais de valeurs en dur), filtres résultat/catégorie + recherche (debounce, `or` ilike adversaire/événement/ville), grille `FightCard` (tilt, W/L/D, trait rouge). **Détail `/combats/:slug`** : scoreboard monumental (PAUL vs adversaire, badge résultat, méthode/round/temps), fiche technique, résumé `RichText`, galerie, JSON-LD SportsEvent.
- **Performance** : sections par `sort_order` (texte/médias alternés), galerie, conseils.
- **Gym** : histoire, disciplines (services), horaires groupés par jour, coachs, formules/tarifs (prix réels ou « sur demande », jamais inventés), lieu, CTA → `/contact?type=gym`.
- **Commentateur** : présentation, événements commentés (rôle affiché), disciplines, prestations (services + descriptif `RichText`), CTA → `/contact?type=booking`.
- **Actualités** : recherche plein texte (`search_fr/en`, websearch) + chips catégorie + pagination « charger plus ». **Détail `/actualites/:slug`** : chapô, cover, corps `RichText`, tags, partage (`navigator.share` → clipboard), JSON-LD Article.
- **Médias** : double filtre type (photo/vidéo/audio) + catégorie, `MediaGallery` + lightbox.
- **Sponsors** : titre imposé « ASSOCIATE YOUR BRAND WITH GREATNESS. », intro, univers (3 activités), chiffres `fight_stats`, audience (si présente), opportunités, formules (`sponsorship_packages` : 7 catégories ordonnées), sponsors actuels par catégorie, FAQ, CTA → `/contact?type=sponsorship`. Le **formulaire 5 étapes** est prévu Phase 5 (le CTA pointe vers contact).
- **Contact** : coordonnées/réseaux depuis `site_settings` (aucun lien inventé, labels textuels — lucide n'exporte pas de marques), `ContactForm` complet (types de demande, `?type=` préselection, zod `contactSchema`, honeypot `website` + délai 3 s → succès simulé, INSERT via `submitContactMessage`, états error/rate_limited).
- **Mentions légales / Confidentialité / Cookies** : contenu depuis `site_settings.legal_*` via `RichText` ; état « en cours de rédaction » sinon. **404** existante conservée.

Infrastructure ajoutée :
- `components/data/` : `DataState` (loading/empty/not_configured/error unifié + compteur de contenu), `Skeleton`, `RichText` (markdown-lite : gras/italique/liens https, titres, listes, guillemets — **aucun HTML injecté**), `Eyebrow` (label mono numéroté), `PageHero` (variantes monumental/poster).
- `components/sections/` : `StatCounters` (compteur GSAP → valeur finale toujours affichée même reduced), `FightCard`, `ArticleCard`, `MediaGallery` (+ lightbox : focus trap, flèches, Échap, verrou scroll), `Timeline` (pin ScrollTrigger horizontal desktop, vertical sinon), `PartnersSignature` (marquee CSS 2 groupes, pause hover/focus, logos gris→rouge ; **si aucun sponsor actif : bloc CTA « devenir partenaire », jamais de faux logo**), `FilterBar` (chips + recherche optionnelle), `VideoBlock` (embed différé), `ContentGrid`, `ValueProps`, `SectionCta`.
- `contexts/SiteSettingsContext` (settings + socials + hero admin, résolution storage public), `hooks/useServiceQuery`, `hooks/useLocalizedField` (`pick`), `utils/formats` (dates/prix FR-EN), `schemas/requests` (zod partagé client/Edge Function).
- Layout : `PartnersSignature` monté sur toutes les pages + `LegalZone` alimentée par `site_settings` (réseaux affichés seulement s'ils sont configurés). Hero : médias surchargeables via `site_settings.hero_*` avec priorité sur `VITE_HERO_*`.
- Routes détail : `/:lang/combats/:slug`, `/:lang/actualites/:slug`.
- `scripts/e2e-server.mjs` : mini-API PostgREST (GET/POST) sur PGlite + seed, **RLS réelle en rôle anon** (`npm run dev:e2e` → :5175, API :54321). Fichier `.env.e2e.local` (URL mock + `VITE_ALLOW_DEMO_CONTENT=true`).

Décisions / pièges :
- **Honeypot vérifié AVANT le safeParse** : `website` a `.max(0)` dans le schéma ; si on validait d'abord, `setError('website')` tombait sur un champ invisible → soumission muette. Ordre actuel : honeypot/délai → succès simulé → sinon safeParse → erreurs localisées. Conséquence assumée : un envoi en <3 s affiche la confirmation sans rien enregistrer (anti-bot standard).
- `DataState` distingue `not_configured` (« source de données non configurée, voir SETUP.md ») de `empty` et `error` — jamais de faux contenu.
- Recherche combats : `or=(opponent.ilike.*x*,event_name.ilike.*x*,city.ilike.*x*)` — le mock e2e supporte `or`.
- Boutons de partage article : `navigator.share` si dispo, sinon copie du lien + état « copié ».

Vérifications phase 4 :
- `npm run typecheck` ✅ · `npm run build` ✅ (pages code-splittées, ~2 s) · `npm test` 8/8 · `npm run db:test` 54/54.
- `npm run dev:e2e` + `node scripts/page-shots.mjs http://localhost:5175 <routes>` : **12 pages desktop + 8 pages mobile (390 px)** — 0 erreur console, 0 overflow horizontal, captures `.artifacts/pages/`.
- Formulaire contact e2e (`scripts/test-form.mjs`, serveur e2e) : `?type=gym` présélectionné, <3 s → succès simulé sans INSERT, formulaire vide → 5 erreurs localisées, honeypot → succès simulé sans INSERT, envoi légitime → **POST 201 à travers la vraie RLS** + confirmation.
- Sans clés (serveur 5173 nu) : pages complètes, états `not_configured` honnêtes, marquee → CTA partenaire, EN vérifié.

## Phase 5 — Formulaires production (fait)

**4 formulaires réels intégrés** (remplacent les CTA vers `/contact?type=…`) :
- **Gym** (`features/forms/GymRegistrationForm`, section 09 de `/gym`) : nom, email, tél., formule (`gym_memberships` chargées), disciplines (chips), niveau, contact préféré, message → `gym_registration_requests`.
- **Booking** (`features/forms/BookingForm`, section 06 de `/commentateur`) : organisateur, événement, date, lieu, discipline, prestation (`commentary_services`), diffusion, audience, budget, message → `booking_requests`. Fallback `mailto:` conservé si `bookingEmail`/`contactEmail` configuré.
- **Sponsoring 5 étapes** (`features/forms/SponsorshipForm`, section 08 de `/sponsors`) : ① entreprise (+logo) ② contact ③ partenariat (formule → `packageTier` dérivé, activités boxing/gym/commentary, objectifs, budget, dates) ④ présentation (+pièce jointe) ⑤ revue + consentement → `sponsorship_requests`. Validation **par étape** (`sponsorshipSchema.pick` sur `SPONSOR_STEP_FIELDS`).
- **Contact** refactorisé sur l'infra partagée (même comportement, tests e2e inchangés dans leur intention).

**Infra partagée `features/forms/`** : `fields.tsx` (Field, Chips, SelectInput, ConsentField, Honeypot, FileField, FormError, FormSuccess) + `fields.module.css`, `forms.module.css` (layouts), `useAntispam` (délai 3 s + honeypot), `useTurnstile` (widget optionnel via `VITE_TURNSTILE_SITE_KEY`, script chargé à la demande), `formIssues.ts` (issues zod → `form.errors.*` localisées).

**Schémas `src/schemas/requests.ts`** : `contactSchema`, `gymRegistrationSchema`, `bookingSchema`, `sponsorshipSchema` — bornes = CHECK SQL. Constantes fichiers (`ATTACHMENT_*`, `LOGO_*`, `SPONSOR_FILE_FIELDS`).

**`services/requests.ts`** : `submitRequest(kind, snakeCasePayload, {files, turnstileToken})` route vers :
- **Edge Function** si `VITE_SUBMIT_FUNCTION=true` (+ Supabase configuré) : POST `/functions/v1/submit-request` `{table, data, files[], turnstile_token}` → `{ok, id, uploads}` puis `uploadToSignedUrl` par fichier → `uploadWarnings` remontés à l'UI (demande enregistrée même si un upload échoue) ;
- **INSERT direct** sinon (RLS, jamais de `.select()`) ; fichiers ignorés, `canAttachFiles === false` masque les FileField.
Wrappers directs conservés (`submitContactMessage`…) pour la compatibilité des tests.

**Edge Function `supabase/functions/submit-request`** (Deno, non déployée — écrite + testée via mock) :
- `Deno.serve`, CORS POST/OPTIONS, allowlist des 4 tables.
- Honeypot `website` → `{ok:true}` sans insert ; validation zod serveur (`_shared/request-schemas.ts` — **miroir snake_case du payload**, pas camelCase : les formulaires envoient déjà les colonnes SQL) ; Turnstile siteverify si `TURNSTILE_SECRET_KEY` ; allowlist fichiers (champs logo/attachment, MIME, tailles) réservée au sponsoring.
- INSERT `service_role` (le trigger `guard_public_request` reste actif) ; chemins `table/id/champ.ext` inscrits en base + `createSignedUploadUrl` ; email Resend si secrets → `email_notified_at` sinon `email_notification_error='not_configured'`.
- Secrets documentés : `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` (SETUP.md § 5 bis).

**Mock e2e** (`scripts/e2e-server.mjs`) : rejoue la function (`POST /functions/v1/submit-request` → insert superuser = service_role, trigger actif, `email_notification_error='not_configured'`, uploads signés simulés) + endpoint `POST/PUT /storage/v1/object/upload/sign/attachments/*` (token requis). `VITE_SUBMIT_FUNCTION=true` injecté au Vite e2e.

**Pièges rencontrés** :
- `en/sections.ts` utilise `Pick<CommonTranslation, …>` → toute nouvelle clé de section doit y être ajoutée.
- i18next typé : `t(\`cle.${value}\`)` exige des unions littérales — typer l'état des formulaires avec les unions (`'' | SizeValue`, `ActivityValue[]`…), pas `string`.
- `TFunction` typé incompatible avec `(k: string) => string` → typer les helpers en `TFunction`.
- `getByLabel('Email')` Playwright matche aussi un radio de valeur « email » → sélecteurs `input[type=email]` dans les tests.
- `ConsentField`/`Honeypot` partagés n'ont pas d'attribut `name` → `input[type=checkbox]:not(.sr-only)` dans les tests.

Vérifications phase 5 :
- `npm run typecheck` ✅ · `npm run build` ✅ · `npm test` 8/8 · `npm run db:test` 54/54 · `npm run smoke` ✅.
- `node scripts/test-form.mjs` : **10/10** — piège temporel, honeypot, validation localisée, envoi via `/functions/v1/submit-request` (POST 200) + confirmation.
- `node scripts/test-forms.mjs` : **9/9** — gym + booking + sponsoring 5 étapes (erreur bloquante étape 1, activités cochées, **logo + PDF uploadés via URLs signées simulées** : 2 PUT storage).
- Captures `page-shots.mjs` `/fr/gym` `/fr/commentateur` `/fr/sponsors` : formulaires intégrés, mise en page propre.
- ⚠️ **Non testé sur vrai projet Supabase** : déploiement function, Resend réel, Turnstile réel, upload signé réel. À faire dès que les clés sont fournies (SETUP.md § 5 bis).

## Phase 6 — Back-office `/admin` (fait)

**Routes** (`src/routes/AppRouter.tsx`, hors préfixe langue, lazy) :
- `/admin/login` — connexion email+mdp (`signInWithPassword`), états loading/erreur/denied/not-configured.
- `/admin` sous `AdminRoot` (provider) → `AdminLayout` (guard : session + rôle `admin_users` via RLS ; anonyme → login avec `?from`, compte non-admin → page « refusé » + logout).
- `/admin/demandes`, `/admin/contenus/:resource` (+`/nouveau`, `/:id`), `/admin/reglages`.

**Fichiers clés**
- `src/services/admin.ts` — auth (`signInAdmin`, `signOutAdmin`, `fetchAdminRole` via `admin_users`), CRUD générique (`adminList/Get/Insert/Update/Delete` — `.from(table as never)`, la RLS est la seule sécurité), inbox (`listRequestRows`, `updateRequestRow`, `signedReadUrl` bucket `attachments`), `fetchDashboardCounts` (HEAD `count:exact`).
- `src/features/admin/AdminAuth.tsx` — provider : `loading → anonymous | denied | ready`, restauration de session (`persistSession: true` déjà actif), `onAuthStateChange`.
- `src/features/admin/resources.ts` — config des **15 ressources** (table, groupe nav, colonnes liste/recherche, `FieldDef[]` : types `text|textarea|richtext|url|slug|date|datetime|number|select|checkbox|tags|ref|json`, `localized` → `_fr`/`_en`, `required`, `half`, `hint`). Singletons : `profil` (profiles), `site_settings` (via `SETTINGS_FIELDS`, route `/admin/reglages`). `equipe` (admin_users) = `ownerOnly`.
- `src/features/admin/ui.tsx` — kit : `AdminTable` (clic clavier+souris, badges statut), `AdminField` (champs config, `_fr`/`_en` côte à côte, `ref` peuplé par `adminList`), `AdminTabs`, `AdminDrawer` (Échap + focus), `ConfirmButton`, `AdminButton`, `KpiCard`, états loading/error/empty.
- `src/features/admin/ResourceForm.tsx` — formulaire générique : `buildPayload` (seules colonnes du form, `''`→`null`), `missingRequired` (validation avant envoi), save → feedback `role=status|alert`.
- `src/features/admin/admin.module.css` — 780 lignes : palette locale `--admin-*` (le site n'expose que 8 tokens), sidebar sticky → barre horizontale <900px, table scroll-x, drawer animé, badges par ton.
- `src/pages/admin/` — `AdminRoot`, `AdminLayout` (nav groupée, rôle affiché, lien retour site, logout), `LoginPage`, `DashboardPage` (KPI demandes/contenus cliquables), `RequestsPage` (4 onglets `?table=` + filtre statut `?status=`, pagination 25, drawer : détail générique, statut+notes, PJ `logo_path`/`attachment_path` via URLs signées, état notification email, suppression confirmée), `ResourceListPage` (recherche debounce via `searchCols`, ou `SingletonForm` si `singleton`), `ResourceEditPage` (création → redirect édition, suppression confirmée), `SettingsPage`.
- i18n : `admin.*` complet FR/EN dans `sections.ts` (chrome UI traduite ; labels de champs littéraux `{fr,en}` dans resources.ts). `enums.status`/`enums.requestStatus` réutilisés par les badges.

**Mock e2e (`scripts/e2e-server.mjs`)** — comptes `admin@e2e.local`/`e2e-pass` (owner) + `fan@e2e.local` (non admin), `/auth/v1 token|user|logout`, Bearer → rôle `authenticated` + `request.jwt.claim.sub` (RLS réelle PGlite). Corrections faites : **HEAD** géré (count:exact → `content-range: */N`), **`Accept: vnd.pgrst.object`** honoré sur POST/PATCH (`.single()`), **CORS** étendu à PATCH/DELETE/HEAD, ordre des params SET/WHERE.

**Validation**
- `npm run typecheck` ✅ · `npm run build` ✅ (chunks admin séparés) · `npm test` 18/18 · `npm run db:test` 54/54 · `npm run smoke` ✅.
- `node scripts/test-admin.mjs` : **16/16** — guard→login, mauvais mdp, login→dashboard, KPI, sidebar, 4 onglets inbox, drawer (statut→contacted + note → badge maj), CRUD combats (édition enregistrée), réglages (36 champs), équipe owner, logout, guard post-logout.
- Bug réel trouvé par le test : le feedback « Enregistré. » du drawer était effacé par l'effet `[row]` — dépendance fixée sur `row?.id`.

## Phase 7 — Qualité (fait)

**Tests** — `npm test` : **33/33** dans 6 fichiers. jsdom@25 installé ; pas de Testing Library (npm/OneDrive trop lent) → helper maison `src/test/render.tsx` (`mount` via `createRoot` + `act` natif React 19, `click`/`keydown`/`setValue` wrappés dans `act`). Env jsdom par pragma `// @vitest-environment jsdom` en tête de fichier ; `src/test/setup.ts` = i18n global + polyfills (IntersectionObserver/matchMedia/scrollTo). Couvre : helpers ResourceForm (payload/requis/défauts), StatusBadge, AdminTable (clic+clavier), ConfirmButton 2 temps, AdminDrawer (Échap), Honeypot (tabIndex -1, aria-hidden), ConsentField.

**A11y** — `node scripts/a11y-check.mjs` : audit maison sur 24 routes (h1 unique, ordre des titres, alt, noms accessibles, labels de champs, cibles ≥24 px, skip-link). **Fixes réels trouvés** : cartes articles `h3→h2` paramétrable (`titleLevel`, utilisé sur `/actualites`), `Button variant=link` `min-height:1.5rem` (WCAG 2.5.8). Faux positifs filtrés : inputs masqués dans `<label>` (la cible est le label), honeypot `aria-hidden`. Résultat : **24 routes propres**.

**Perf** — `LazyMotion features={domAnimation}` passé en `features={() => import('framer-motion').then(m => m.domAnimation)}` (`src/App.tsx`) : **bundle initial 404→299 kB, gzip 132→96 kB (−36 kB)**. Chunks déjà séparés : gsap 27 kB, supabase-js 56 kB (lazy via `getSupabase`), pages par route.

**SEO statique** — `public/robots.txt` (allow all sauf `/admin`, réf sitemap) + `scripts/gen-sitemap.mjs` (`npm run sitemap` : routes statiques FR/EN + slugs publiés combats/articles via API si configurée ; lit `VITE_SITE_URL` env ou `.env*`).

**Doc** — `README.md` racine : quick start, commandes, architecture, checklist déploiement (migrations → buckets → function → compte admin → env → sitemap → build → SPA fallback).

## Assets réels fournis (fait — nov. 2025)

`public/media/` contient les vrais fichiers de Paul, branchés sur le site :
- `hero-mobile.mp4` (360×640, 57 s, vidéo de combat réelle) → `VITE_HERO_VIDEO_MOBILE_MP4` + `site_settings.hero_video_mobile_url` ; joue en fond du hero mobile (vérifié `playing:true`). `Hero.tsx` corrigé : `playVideo` tient compte du cas « vidéo mobile seule ».
- `paul-portrait.jpg` (854×1280) → `profiles.portrait_url` + media `portrait`.
- `paul-victoire.jpg` → `hero_poster_url` (poster hero desktop) + media `portrait`.
- `paul-gym-ceinture.jpg` → `gym_hero_poster_url` + `og_image_url` + media `gym`.
- `paul-garde.jpg` → media `training`.

**Convention** : les colonnes `*_url`/`storage_path` sont des **chemins relatifs au bucket `media`** (ex. `paul-portrait.jpg`), résolus par `publicStorageUrl('media', path)` → `{SUPABASE_URL}/storage/v1/object/public/media/<path>`. En e2e, le mock sert ce bucket depuis `public/media/` (`GET /storage/v1/object/public/<bucket>/<path>` → `public/<bucket>/<path>`). `.env.local` fournit un repli `/media/…` servi directement par Vite.
**En prod** : uploader ces fichiers dans le bucket public `media` du vrai projet (mêmes noms) — ou garder les fichiers dans `public/` et renseigner `VITE_HERO_*` avec `/media/…` (les `*_url` en base doivent alors être vides pour laisser le repli env jouer).
`external_url` n'accepte que `https://` (contrainte SQL) → jamais de chemin local dans cette colonne.

## Reste à faire / notes pour la suite
- **Assets encore à fournir** : vidéo hero **desktop** 1080p MP4 (+WebM idéal), poster WebP optimisé, plus de photos, logo PAUL (SVG).
- **Clés à fournir** : projet Supabase (URL + anon), puis secrets de la function (Turnstile, Resend) — voir `docs/SETUP.md` § 2 et 5 bis. **Compte(s) admin** à créer : utilisateur Supabase Auth + ligne `admin_users` (rôle owner pour le 1er) — la RLS fait le reste.
- **Avant mise en prod** : `VITE_SITE_URL` réel → `npm run sitemap`, `VITE_ALLOW_DEMO_CONTENT` absent (masque les DEMO), déployer `submit-request` + secrets, `VITE_SUBMIT_FUNCTION=true`.
- Options non retenues : Testing Library (helper `src/test/render.tsx` suffit ; l'installer plus tard reste possible — `jsdom@25` déjà présent), Lighthouse (Chrome requis en headless non dispo ; audit manuel maison fait).
