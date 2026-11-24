-- =====================================================================
-- PAUL — 0004 Sécurité : privilèges + Row Level Security
-- =====================================================================
-- Principe : tout est fermé, puis ouvert explicitement.
--   * anon / authenticated : SELECT du contenu publié, INSERT des formulaires.
--   * écriture du contenu, lecture des demandes : is_admin() vérifié PAR LA BASE.
--   * service_role (Edge Functions uniquement, jamais dans le frontend) contourne la RLS.
-- =====================================================================

-- 1. Privilèges de table (défense en profondeur, en plus de la RLS) -------------
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.fights, public.fight_stats, public.achievements, public.performance_contents,
  public.gym_services, public.gym_coaches, public.gym_schedules, public.gym_memberships,
  public.commentary_events, public.commentary_services, public.media, public.articles,
  public.sponsorship_packages, public.sponsors, public.site_settings
to anon, authenticated;

grant insert on
  public.gym_registration_requests, public.sponsorship_requests, public.booking_requests, public.contact_messages
to anon, authenticated;

-- authenticated : droits SQL larges, mais chaque ligne est filtrée par is_admin() via la RLS.
grant insert, update, delete on
  public.profiles, public.fights, public.achievements, public.performance_contents,
  public.gym_services, public.gym_coaches, public.gym_schedules, public.gym_memberships,
  public.commentary_events, public.commentary_services, public.media, public.articles,
  public.sponsorship_packages, public.sponsors, public.admin_users
to authenticated;
grant update on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;
grant select, update, delete on
  public.gym_registration_requests, public.sponsorship_requests, public.booking_requests, public.contact_messages
to authenticated;

-- 2. RLS activée PARTOUT ----------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_users', 'profiles', 'fights', 'achievements', 'performance_contents', 'gym_services',
    'gym_coaches', 'gym_schedules', 'gym_memberships', 'commentary_events', 'commentary_services',
    'media', 'articles', 'sponsorship_packages', 'sponsors', 'site_settings',
    'gym_registration_requests', 'sponsorship_requests', 'booking_requests', 'contact_messages'
  ] loop
    -- Pas de FORCE : les fonctions SECURITY DEFINER (is_admin, guard_public_request),
    -- exécutées en tant que propriétaire, doivent lire sans repasser par la RLS (sinon récursion).
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- 3. Contenus éditoriaux (colonne status) ------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'fights', 'achievements', 'performance_contents', 'gym_services', 'gym_coaches',
    'gym_schedules', 'gym_memberships', 'commentary_events', 'commentary_services', 'media',
    'articles', 'sponsorship_packages'
  ] loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (status = %L or (select public.is_admin()))',
      t || ': read published (admin: all)', t, 'published');
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.is_admin()))',
      t || ': admin insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || ': admin update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))',
      t || ': admin delete', t);
  end loop;
end;
$$;

-- 4. Sponsors : visibles s'ils sont actifs et dans leur période --------------------
create policy "sponsors: read active (admin: all)" on public.sponsors
  for select to anon, authenticated
  using (
    (is_active
      and (starts_on is null or starts_on <= current_date)
      and (ends_on is null or ends_on >= current_date))
    or (select public.is_admin())
  );
create policy "sponsors: admin insert" on public.sponsors
  for insert to authenticated with check ((select public.is_admin()));
create policy "sponsors: admin update" on public.sponsors
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "sponsors: admin delete" on public.sponsors
  for delete to authenticated using ((select public.is_admin()));

-- 5. Paramètres du site : lecture publique, modification admin (ligne unique, pas d'insert/delete)
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site_settings: admin update" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- 6. Administrateurs : chacun voit sa ligne, les admins voient tout, seul un owner gère
create policy "admin_users: read self or admin" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin_users: owner insert" on public.admin_users
  for insert to authenticated with check ((select public.is_owner()));
create policy "admin_users: owner update" on public.admin_users
  for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "admin_users: owner delete" on public.admin_users
  for delete to authenticated using ((select public.is_owner()));

-- 7. Demandes entrantes : INSERT public, tout le reste admin -----------------------
do $$
declare
  t text;
begin
  foreach t in array array['gym_registration_requests', 'sponsorship_requests', 'booking_requests', 'contact_messages'] loop
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated with check (status = %L and internal_notes is null and handled_by is null)',
      t || ': public insert', t, 'new');
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.is_admin()))',
      t || ': admin read', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || ': admin update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))',
      t || ': admin delete', t);
  end loop;
end;
$$;
