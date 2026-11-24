-- =====================================================================
-- PAUL — 0001 Fondations : helpers, administrateurs, is_admin()
-- =====================================================================
-- Conventions :
--   * chaque table : id uuid, created_at, updated_at (trigger), created_by si pertinent
--   * contenus bilingues : colonnes *_fr / *_en (pas de traduction automatique)
--   * statut éditorial : draft | published | archived
--   * is_demo = true uniquement pour les lignes créées par seed.sql (jamais en production)
-- =====================================================================

-- Trigger générique updated_at -----------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Administrateurs du back-office ---------------------------------------
-- Aucune inscription publique : une ligne ici = accès admin.
-- Création du premier compte : voir supabase/scripts/create_first_admin.sql
create table public.admin_users (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users (id) on delete cascade,
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  display_name text check (char_length(display_name) <= 120),
  role         text not null default 'editor' check (role in ('owner', 'admin', 'editor')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null
);

comment on table public.admin_users is 'Comptes autorisés à accéder au back-office /admin. owner = gestion des admins.';

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- is_admin() : SECURITY DEFINER (lit admin_users sans dépendre de ses policies),
-- search_path vide → toutes les références sont qualifiées.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active
      and au.role = 'owner'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- Empêche qu'un owner se retire lui-même ses droits (verrouillage du back-office).
create or replace function public.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and (new.role <> 'owner' or not new.is_active)) then
    select count(*) into remaining
    from public.admin_users
    where role = 'owner' and is_active and id <> old.id;
    if remaining = 0 then
      raise exception 'LAST_OWNER: au moins un owner actif est requis' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger admin_users_guard_last_owner
  before update or delete on public.admin_users
  for each row execute function public.guard_last_owner();
