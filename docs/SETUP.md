# Configuration Supabase — PAUL Official

Ce guide connecte le site à un projet Supabase. Sans configuration, le site fonctionne
mais toutes les sections dynamiques affichent un état vide honnête (aucune donnée simulée).

## 1. Créer le projet

1. https://supabase.com → **New project** (région proche du public, ex. `eu-west-3` Paris).
2. Noter le mot de passe de la base (nécessaire pour la CLI).
3. **Project Settings → API** : copier `Project URL` et la clé **anon public**.

## 2. Variables d'environnement du frontend

```bash
cp .env.example .env.local
```

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet |
| `VITE_SUPABASE_ANON_KEY` | clé **anon** (publique ; la sécurité repose sur la RLS) |
| `VITE_SITE_URL` | URL publique du site (canonical, hreflang, OG) |
| `VITE_ALLOW_DEMO_CONTENT` | `true` uniquement pour une préproduction de démonstration |
| `VITE_HERO_*` | médias du hero (chemin `public/media/…` ou URL Storage) |

| `VITE_TURNSTILE_SITE_KEY` | clé **site** Cloudflare Turnstile (optionnel — widget anti-spam) |
| `VITE_SUBMIT_FUNCTION` | `true` une fois l'Edge Function `submit-request` déployée (§ 5 bis) |

> ⚠️ **Jamais** de clé `service_role` dans `.env.local`, dans le code frontend ou dans le dépôt.
> Elle n'est utilisée que par les Edge Functions (secrets côté Supabase, § 5 bis).
>
> ⚠️ Sous Git Bash, ne passez pas les chemins `/media/...` en variable de ligne de commande
> (conversion automatique en chemin Windows) : utilisez `.env.local`.

## 3. Appliquer les migrations

Fichiers, dans l'ordre (`supabase/migrations/`) :

| Fichier | Contenu |
|---|---|
| `20261121000100_foundation.sql` | `set_updated_at()`, `admin_users`, `is_admin()`, `is_owner()`, garde du dernier owner |
| `20261121000200_content.sql` | 15 tables de contenu + vue `fight_stats` + ligne `site_settings` |
| `20261121000300_requests.sql` | 4 tables de demandes + trigger anti-spam `guard_public_request` |
| `20261121000400_rls.sql` | privilèges + RLS sur les 20 tables |
| `20261121000500_storage.sql` | buckets `media`, `logos`, `attachments` + policies |

> **Assets fournis** : `public/media/` contient les vrais fichiers (`hero-mobile.mp4`, `paul-*.jpg`). Pour les utiliser via l'admin en prod, uploadez-les dans le bucket public `media` **avec les mêmes noms** puis renseignez les colonnes `*_url`/`storage_path` avec le nom du fichier (ex. `paul-portrait.jpg`). Sinon, `VITE_HERO_*=/media/…` dans `.env` sert les fichiers depuis `public/` directement (repli automatique quand les colonnes sont vides).

### Option A — CLI Supabase (recommandé)

```bash
npx supabase init            # crée supabase/config.toml (les migrations existantes sont conservées)
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push         # applique les migrations dans l'ordre
```

### Option B — SQL Editor du dashboard

Coller et exécuter chaque fichier **dans l'ordre** ci-dessus.

### Ne PAS exécuter `seed.sql` en production

`supabase/seed.sql` contient uniquement des données **DEMO** fictives (`is_demo = true`,
libellés « [DEMO] »). Il est joué automatiquement par `supabase db reset` en local (Docker).
Si exécuté par erreur : `supabase/scripts/purge_demo.sql`.

## 4. Créer le premier administrateur

Il n'y a **aucune inscription publique**.

1. Dashboard → **Authentication → Users → Add user** (email + mot de passe, « Auto confirm »).
2. Dashboard → **SQL Editor** : ouvrir `supabase/scripts/create_first_admin.sql`,
   remplacer l'email, exécuter. Le compte devient `owner`.
3. Les autres comptes (`admin`, `editor`) se gèrent ensuite depuis `/admin` par un owner.
   Un owner ne peut pas retirer le dernier owner actif (protection anti-verrouillage).

Recommandé : Authentication → Providers → Email → désactiver « Allow new users to sign up ».

## 5. Modèle de sécurité (résumé)

| Rôle | Contenus | Demandes (formulaires) | Storage |
|---|---|---|---|
| `anon` (visiteur) | lecture du **publié** uniquement | **INSERT** seulement, statut forcé à `new`, limité à 3 envois / 10 min / email et 30 / min au total | aucun accès API (fichiers publics via URL publique) |
| `authenticated` non admin | comme anon | comme anon | aucun |
| admin (`admin_users`, actif) | lecture + écriture | lecture + traitement | lecture + écriture |
| owner | idem admin + gestion des admins | idem | idem |

- `is_admin()` / `is_owner()` : `SECURITY DEFINER`, `search_path` vide, vérifiés **par la base** (RLS).
- Contenus bilingues : colonnes `*_fr` / `*_en` ; les contraintes refusent la publication
  d'un texte présent dans une seule langue.
- Statistiques de combat : vue `fight_stats` (`security_invoker`), calculée depuis les combats publiés.
- Pièces jointes des demandes : bucket **privé** `attachments` ; l'upload public passe par une
  URL signée délivrée par l'Edge Function (§ 5 bis) — aucune policy d'écriture anonyme.

## 5 bis. Edge Function `submit-request` (formulaires production)

`supabase/functions/submit-request` est le point d'entrée serveur des 4 formulaires publics :

1. re-valide le payload avec les mêmes bornes que le client (`_shared/request-schemas.ts`,
   miroir snake_case de `src/schemas/requests.ts` — modifier les deux ensemble) ;
2. honeypot + vérification **Turnstile** (si `TURNSTILE_SECRET_KEY` configurée) ;
3. INSERT via `service_role` — le trigger `guard_public_request` reste actif (statut forcé,
   anti-spam email/global) ;
4. pièces jointes (sponsoring) : URL d'**upload signée** dans le bucket privé `attachments`,
   chemin inscrit en base (`logo_path` / `attachment_path`) ; le client uploade ensuite
   directement vers l'URL signée ;
5. notification email via **Resend** → `email_notified_at`, sinon `email_notification_error`
   (`not_configured` si Resend absent — l'admin affiche « notification non activée »).

### Déploiement

```bash
npx supabase functions deploy submit-request
```

Secrets (dashboard → Edge Functions → Secrets, ou `supabase secrets set`) — **jamais côté frontend** :

| Secret | Rôle | Obligatoire |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | vérifie les jetons du widget (paire de `VITE_TURNSTILE_SITE_KEY`) | non |
| `RESEND_API_KEY` | notification email des nouvelles demandes | non |
| `NOTIFY_EMAIL_TO` | destinataire des notifications | avec Resend |
| `NOTIFY_EMAIL_FROM` | expéditeur vérifié Resend | avec Resend |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par la plateforme.

Puis côté frontend : `VITE_SUBMIT_FUNCTION=true` dans `.env.local` + rebuild.
Sans la function, les formulaires fonctionnent en **INSERT direct** (RLS) ; les pièces
jointes du formulaire sponsoring sont alors simplement masquées (`canAttachFiles === false`).

> Turnstile : créer le widget sur https://dash.cloudflare.com → Turnstile → **site key**
> dans `VITE_TURNSTILE_SITE_KEY` (public) et **secret key** dans les secrets de la function.

## 6. Types TypeScript

`src/integrations/supabase/database.types.ts` est **généré** depuis les migrations :

```bash
npm run db:types                                     # depuis les migrations (PGlite, hors ligne)
npx supabase gen types typescript --linked --schema public > src/integrations/supabase/database.types.ts   # officiel
```

Les domaines métier (CHECK) sont typés dans `src/types/domain.ts`.

## 7. Vérifications

```bash
npm run db:test   # applique les migrations + seed dans PGlite et teste la RLS rôle par rôle (53 vérifications)
npm test          # couche services (requêtes PostgREST générées, mode non configuré)
```

`db:test` utilise un **shim** (`supabase/tests/supabase_shim.sql`) qui reproduit les rôles,
`auth.uid()` et `storage` de Supabase. Il ne doit jamais être exécuté sur un vrai projet.
Une fois le projet créé, refaire un contrôle réel : se connecter en anon (site public) et
vérifier qu'un brouillon n'apparaît pas.
