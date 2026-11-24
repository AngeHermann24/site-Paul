-- =====================================================================
-- PAUL — 0003 Demandes entrantes (formulaires publics)
-- =====================================================================
-- Public : INSERT uniquement (jamais de SELECT). Admin : lecture / traitement.
-- Statuts : new | in_review | contacted | accepted | rejected | archived
-- Anti-spam côté base : trigger `guard_public_request` (statut forcé, champs internes
-- vidés, limitation par email et globale). Honeypot / délai / Turnstile : Edge Function (phase 5).
-- =====================================================================

create table public.gym_registration_requests (
  id                        uuid primary key default gen_random_uuid(),
  full_name                 text not null check (char_length(full_name) between 2 and 120),
  email                     text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                     text check (char_length(phone) <= 40),
  membership_id             uuid references public.gym_memberships (id) on delete set null,
  disciplines               text[] not null default '{}' check (cardinality(disciplines) <= 10),
  experience_level          text check (experience_level in ('none', 'beginner', 'intermediate', 'advanced', 'competitor')),
  preferred_contact         text not null default 'email' check (preferred_contact in ('email', 'phone')),
  message                   text check (char_length(message) <= 3000),
  consent                   boolean not null check (consent),
  locale                    text not null default 'fr' check (locale in ('fr', 'en')),
  status                    text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'accepted', 'rejected', 'archived')),
  internal_notes            text,
  handled_by                uuid references auth.users (id) on delete set null,
  handled_at                timestamptz,
  email_notified_at         timestamptz,
  email_notification_error  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.sponsorship_requests (
  id                        uuid primary key default gen_random_uuid(),
  -- Étape 1 : entreprise
  company_name              text not null check (char_length(company_name) between 2 and 160),
  company_website           text check (company_website is null or company_website ~* '^https?://'),
  company_sector            text check (char_length(company_sector) <= 120),
  company_size              text check (company_size in ('1-10', '11-50', '51-250', '251-1000', '1000+')),
  company_country           text check (char_length(company_country) <= 80),
  logo_path                 text,   -- bucket privé `attachments`
  -- Étape 2 : contact
  contact_name              text not null check (char_length(contact_name) between 2 and 120),
  contact_role              text check (char_length(contact_role) <= 120),
  email                     text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                     text check (char_length(phone) <= 40),
  -- Étape 3 : partenariat
  package_tier              text check (package_tier in ('main', 'gold', 'silver', 'official', 'technical', 'media', 'event', 'undecided')),
  package_id                uuid references public.sponsorship_packages (id) on delete set null,
  activities                text[] not null default '{}' check (activities <@ array['boxing', 'gym', 'commentary']::text[]),
  objectives                text[] not null default '{}' check (cardinality(objectives) <= 10),
  budget_range              text check (budget_range in ('lt_5k', '5k_15k', '15k_50k', '50k_150k', 'gt_150k', 'undisclosed')),
  desired_start             date,
  duration_months           smallint check (duration_months between 1 and 60),
  -- Étape 4 : présentation
  presentation              text not null check (char_length(presentation) between 20 and 5000),
  attachment_path           text,   -- bucket privé `attachments`
  -- Méta
  consent                   boolean not null check (consent),
  locale                    text not null default 'fr' check (locale in ('fr', 'en')),
  status                    text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'accepted', 'rejected', 'archived')),
  internal_notes            text,
  assigned_to               uuid references auth.users (id) on delete set null,
  handled_by                uuid references auth.users (id) on delete set null,
  handled_at                timestamptz,
  email_notified_at         timestamptz,
  email_notification_error  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.booking_requests (
  id                        uuid primary key default gen_random_uuid(),
  organizer_name            text not null check (char_length(organizer_name) between 2 and 120),
  organization              text check (char_length(organization) <= 160),
  email                     text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                     text check (char_length(phone) <= 40),
  event_name                text not null check (char_length(event_name) between 2 and 200),
  event_date                date,
  event_city                text check (char_length(event_city) <= 120),
  event_country             text check (char_length(event_country) <= 80),
  discipline                text check (char_length(discipline) <= 80),
  service_id                uuid references public.commentary_services (id) on delete set null,
  broadcast_type            text check (broadcast_type in ('live_event', 'tv', 'streaming', 'podcast', 'corporate', 'other')),
  audience_size             text check (audience_size in ('lt_500', '500_2k', '2k_10k', 'gt_10k', 'unknown')),
  budget_range              text check (budget_range in ('lt_1k', '1k_3k', '3k_10k', 'gt_10k', 'undisclosed')),
  message                   text not null check (char_length(message) between 10 and 5000),
  consent                   boolean not null check (consent),
  locale                    text not null default 'fr' check (locale in ('fr', 'en')),
  status                    text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'accepted', 'rejected', 'archived')),
  internal_notes            text,
  handled_by                uuid references auth.users (id) on delete set null,
  handled_at                timestamptz,
  email_notified_at         timestamptz,
  email_notification_error  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.contact_messages (
  id                        uuid primary key default gen_random_uuid(),
  type                      text not null check (type in ('professional', 'collaboration', 'booking', 'media', 'sponsorship', 'gym', 'other')),
  full_name                 text not null check (char_length(full_name) between 2 and 120),
  email                     text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone                     text check (char_length(phone) <= 40),
  organization              text check (char_length(organization) <= 160),
  subject                   text not null check (char_length(subject) between 2 and 200),
  message                   text not null check (char_length(message) between 10 and 5000),
  consent                   boolean not null check (consent),
  locale                    text not null default 'fr' check (locale in ('fr', 'en')),
  status                    text not null default 'new' check (status in ('new', 'in_review', 'contacted', 'accepted', 'rejected', 'archived')),
  internal_notes            text,
  handled_by                uuid references auth.users (id) on delete set null,
  handled_at                timestamptz,
  email_notified_at         timestamptz,
  email_notification_error  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Index de traitement admin + limitation par email
create index gym_registration_requests_inbox_idx on public.gym_registration_requests (status, created_at desc);
create index gym_registration_requests_email_idx on public.gym_registration_requests (lower(email), created_at desc);
create index sponsorship_requests_inbox_idx on public.sponsorship_requests (status, created_at desc);
create index sponsorship_requests_email_idx on public.sponsorship_requests (lower(email), created_at desc);
create index booking_requests_inbox_idx on public.booking_requests (status, created_at desc);
create index booking_requests_email_idx on public.booking_requests (lower(email), created_at desc);
create index contact_messages_inbox_idx on public.contact_messages (status, created_at desc);
create index contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);
create index contact_messages_type_idx on public.contact_messages (type, created_at desc);

-- Garde des insertions publiques --------------------------------------------------
-- SECURITY DEFINER : doit compter des lignes que le public ne peut pas lire.
create or replace function public.guard_public_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  per_email_limit constant integer := 3;   -- par adresse, sur 10 minutes
  global_limit    constant integer := 30;  -- toutes adresses, sur 1 minute
  recent_email    integer;
  recent_global   integer;
begin
  -- Les administrateurs (back-office) ne sont pas limités.
  if public.is_admin() then
    return new;
  end if;

  -- Le public ne peut jamais fixer les champs de traitement.
  new.email := lower(trim(new.email));
  new.status := 'new';
  new.internal_notes := null;
  new.handled_by := null;
  new.handled_at := null;
  new.email_notified_at := null;
  new.email_notification_error := null;
  new.created_at := now();
  new.updated_at := now();
  if tg_table_name = 'sponsorship_requests' then
    new.assigned_to := null;
  end if;

  execute format(
    'select count(*) from public.%I where lower(email) = $1 and created_at > now() - interval ''10 minutes''',
    tg_table_name
  ) into recent_email using new.email;

  if recent_email >= per_email_limit then
    raise exception 'RATE_LIMITED' using errcode = 'P0001', hint = 'Trop de demandes pour cette adresse. Réessayez plus tard.';
  end if;

  execute format(
    'select count(*) from public.%I where created_at > now() - interval ''1 minute''',
    tg_table_name
  ) into recent_global;

  if recent_global >= global_limit then
    raise exception 'RATE_LIMITED' using errcode = 'P0001', hint = 'Service momentanément saturé. Réessayez dans une minute.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_public_request() from public;

do $$
declare
  t text;
begin
  foreach t in array array['gym_registration_requests', 'sponsorship_requests', 'booking_requests', 'contact_messages'] loop
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.guard_public_request()',
      t || '_guard_public_insert', t
    );
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;
