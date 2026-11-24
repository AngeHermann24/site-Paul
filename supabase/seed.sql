-- =====================================================================
--  ██████╗ ███████╗███╗   ███╗ ██████╗
--  ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
--  ██║  ██║█████╗  ██╔████╔██║██║   ██║
--  ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
--  ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
--  ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝
--
--  DONNÉES DE DÉMONSTRATION — DÉVELOPPEMENT LOCAL UNIQUEMENT
--
--  * Toutes les lignes ont is_demo = true et des libellés préfixés « [DEMO] ».
--  * Aucune de ces données ne décrit Paul : adversaires, dates, résultats, tarifs,
--    sponsors… sont FICTIFS et servent uniquement à tester l'interface.
--  * Le frontend de production filtre is_demo = true (voir src/services/_shared.ts).
--  * Ne JAMAIS exécuter ce fichier sur la base de production.
--    Purge : supabase/scripts/purge_demo.sql
--  * `supabase db reset` (local) l'exécute automatiquement.
-- =====================================================================

insert into public.profiles (slug, display_name, headline_fr, headline_en, bio_short_fr, bio_short_en, status, is_demo)
values (
  'paul', 'PAUL',
  '[DEMO] Titre d''accroche à remplir dans l''admin', '[DEMO] Headline to fill in the admin',
  '[DEMO] Courte biographie fictive pour tester la mise en page.', '[DEMO] Short placeholder biography to test the layout.',
  'published', true
);

insert into public.fights
  (slug, opponent_name, event_name, event_date, city, country, category, fight_status, result, method,
   rounds_scheduled, round_ended, time_ended, summary_fr, summary_en, status, is_demo)
values
  ('demo-combat-1', '[DEMO] Adversaire A', '[DEMO] Gala 1', date '2025-03-15', 'Ville A', 'Pays A', 'professional',
   'completed', 'win', 'ko', 8, 3, '2:14', '[DEMO] Résumé fictif.', '[DEMO] Placeholder summary.', 'published', true),
  ('demo-combat-2', '[DEMO] Adversaire B', '[DEMO] Gala 2', date '2025-07-02', 'Ville B', 'Pays B', 'professional',
   'completed', 'win', 'unanimous_decision', 10, 10, '3:00', '[DEMO] Résumé fictif.', '[DEMO] Placeholder summary.', 'published', true),
  ('demo-combat-3', '[DEMO] Adversaire C', '[DEMO] Gala 3', date '2025-11-20', 'Ville C', 'Pays C', 'professional',
   'completed', 'draw', 'split_decision', 10, 10, '3:00', null, null, 'published', true),
  ('demo-combat-4', '[DEMO] Adversaire D', '[DEMO] Gala 4', current_date + 60, 'Ville D', 'Pays D', 'professional',
   'scheduled', null, null, 10, null, null, null, null, 'published', true),
  ('demo-combat-brouillon', '[DEMO] Adversaire E', '[DEMO] Brouillon', date '2024-01-01', null, null, 'amateur',
   'completed', 'loss', 'tko', 3, 2, '1:05', null, null, 'draft', true);

insert into public.achievements (kind, title_fr, title_en, year, show_in_timeline, sort_order, status, is_demo)
values
  ('milestone', '[DEMO] Débuts', '[DEMO] Debut', 2015, true, 1, 'published', true),
  ('title', '[DEMO] Titre fictif', '[DEMO] Placeholder title', 2023, true, 2, 'published', true);

insert into public.performance_contents (slug, category, title_fr, title_en, excerpt_fr, excerpt_en, sort_order, status, published_at, is_demo)
values
  ('demo-preparation', 'preparation', '[DEMO] Préparation', '[DEMO] Preparation', '[DEMO] Extrait.', '[DEMO] Excerpt.', 1, 'published', now(), true),
  ('demo-endurance', 'endurance', '[DEMO] Endurance', '[DEMO] Endurance', '[DEMO] Extrait.', '[DEMO] Excerpt.', 2, 'published', now(), true);

insert into public.gym_services (slug, kind, title_fr, title_en, description_fr, description_en, sort_order, status, is_demo)
values
  ('demo-boxe-anglaise', 'discipline', '[DEMO] Boxe anglaise', '[DEMO] Boxing', '[DEMO] Description.', '[DEMO] Description.', 1, 'published', true),
  ('demo-cours-collectif', 'class', '[DEMO] Cours collectif', '[DEMO] Group class', null, null, 2, 'published', true),
  ('demo-ring', 'equipment', '[DEMO] Ring', '[DEMO] Ring', null, null, 3, 'published', true);

insert into public.gym_coaches (slug, full_name, role_fr, role_en, specialties, sort_order, status, is_demo)
values ('demo-coach', '[DEMO] Coach A', '[DEMO] Entraîneur', '[DEMO] Coach', '{boxe}', 1, 'published', true);

insert into public.gym_schedules (service_id, coach_id, day_of_week, starts_at, ends_at, status, is_demo)
select s.id, c.id, d, time '18:30', time '20:00', 'published', true
from public.gym_services s, public.gym_coaches c, unnest(array[1, 3, 5]) d
where s.slug = 'demo-boxe-anglaise' and c.slug = 'demo-coach';

insert into public.gym_memberships (slug, name_fr, name_en, price_cents, billing_period, features_fr, features_en, sort_order, status, is_demo)
values
  ('demo-formule-a', '[DEMO] Formule A', '[DEMO] Plan A', 1000, 'month', '{"[DEMO] Avantage 1"}', '{"[DEMO] Benefit 1"}', 1, 'published', true),
  ('demo-formule-b', '[DEMO] Formule B', '[DEMO] Plan B', null, 'year', '{}', '{}', 2, 'published', true);

insert into public.commentary_events (slug, event_name, event_date, role, discipline, status, is_demo)
values ('demo-evenement', '[DEMO] Événement commenté', date '2025-05-10', 'lead_commentator', 'Boxe', 'published', true);

insert into public.commentary_services (slug, title_fr, title_en, deliverables_fr, deliverables_en, sort_order, status, is_demo)
values ('demo-commentaire-live', '[DEMO] Commentaire live', '[DEMO] Live commentary', '{"[DEMO] Livrable"}', '{"[DEMO] Deliverable"}', 1, 'published', true);

insert into public.articles (slug, category, title_fr, title_en, excerpt_fr, excerpt_en, body_fr, body_en, status, published_at, is_demo)
values
  ('demo-article-1', 'news', '[DEMO] Premier article', '[DEMO] First article', '[DEMO] Chapô.', '[DEMO] Standfirst.',
   '[DEMO] Corps de l''article en français. Entraînement et discipline.', '[DEMO] Article body in English. Training and discipline.',
   'published', now() - interval '2 days', true),
  ('demo-article-brouillon', 'gym', '[DEMO] Brouillon', '[DEMO] Draft', null, null, null, null, 'draft', null, true);

insert into public.sponsorship_packages (slug, tier, name_fr, name_en, benefits_fr, benefits_en, sort_order, status, is_demo)
values
  ('demo-sponsor-principal', 'main', '[DEMO] Sponsor principal', '[DEMO] Main sponsor', '{"[DEMO] Visibilité"}', '{"[DEMO] Visibility"}', 1, 'published', true),
  ('demo-partenaire-technique', 'technical', '[DEMO] Partenaire technique', '[DEMO] Technical partner', '{}', '{}', 2, 'published', true);

insert into public.sponsors (slug, name, logo_url, website_url, tier, is_active, is_featured, sort_order, is_demo)
values
  ('demo-marque-a', '[DEMO] Marque A', 'https://placehold.co/240x80/111111/b8b8b8/png?text=DEMO+A', 'https://example.com', 'main', true, true, 1, true),
  ('demo-marque-b', '[DEMO] Marque B', 'https://placehold.co/240x80/111111/b8b8b8/png?text=DEMO+B', 'https://example.com', 'technical', true, false, 2, true),
  ('demo-marque-inactive', '[DEMO] Marque inactive', null, null, 'silver', false, false, 3, true);
