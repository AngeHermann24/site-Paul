-- =====================================================================
-- PAUL — 0002 Contenus publics (lecture publique du publié uniquement)
-- =====================================================================
-- Domaines réutilisés via CHECK (texte) plutôt qu'enum : plus simple à faire évoluer.
--   slug   : ^[a-z0-9]+(-[a-z0-9]+)*$
--   status : draft | published | archived
-- =====================================================================

-- Profil public de Paul (biographie, identité sportive) -----------------
-- Toutes les données factuelles sont NULLABLES : rien n'est inventé, l'admin complète.
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name      text not null check (char_length(display_name) between 1 and 120),
  full_name         text check (char_length(full_name) <= 160),
  nickname          text check (char_length(nickname) <= 80),
  headline_fr       text check (char_length(headline_fr) <= 200),
  headline_en       text check (char_length(headline_en) <= 200),
  bio_short_fr      text check (char_length(bio_short_fr) <= 600),
  bio_short_en      text check (char_length(bio_short_en) <= 600),
  bio_fr            text,
  bio_en            text,
  beginnings_fr     text,
  beginnings_en     text,
  journey_fr        text,
  journey_en        text,
  philosophy_fr     text,
  philosophy_en     text,
  discipline_fr     text,
  discipline_en     text,
  nationality       text check (char_length(nationality) <= 80),
  hometown          text check (char_length(hometown) <= 120),
  birth_date        date check (birth_date > date '1900-01-01'),
  weight_class      text check (char_length(weight_class) <= 80),
  stance            text check (stance in ('orthodox', 'southpaw', 'switch')),
  height_cm         smallint check (height_cm between 120 and 230),
  reach_cm          smallint check (reach_cm between 120 and 250),
  portrait_url      text,
  portrait_alt_fr   text,
  portrait_alt_en   text,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  -- Publication : chaque texte présent doit exister dans les deux langues.
  constraint profiles_bilingual_when_published check (
    status <> 'published' or (
      (headline_fr is null) = (headline_en is null)
      and (bio_short_fr is null) = (bio_short_en is null)
      and (bio_fr is null) = (bio_en is null)
      and (portrait_url is null or (portrait_alt_fr is not null and portrait_alt_en is not null))
    )
  )
);

-- Combats --------------------------------------------------------------
create table public.fights (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  opponent_name     text not null check (char_length(opponent_name) between 1 and 160),
  opponent_country  text check (char_length(opponent_country) <= 80),
  opponent_record   text check (char_length(opponent_record) <= 40),
  event_name        text check (char_length(event_name) <= 200),
  event_date        date not null,
  venue             text check (char_length(venue) <= 200),
  city              text check (char_length(city) <= 120),
  country           text check (char_length(country) <= 80),
  weight_class      text check (char_length(weight_class) <= 80),
  category          text not null default 'professional' check (category in ('professional', 'amateur', 'exhibition')),
  fight_status      text not null default 'completed' check (fight_status in ('scheduled', 'completed', 'cancelled')),
  result            text check (result in ('win', 'loss', 'draw', 'no_contest')),
  method            text check (method in (
                      'ko', 'tko', 'unanimous_decision', 'split_decision', 'majority_decision',
                      'technical_decision', 'rtd', 'dq', 'other')),
  rounds_scheduled  smallint check (rounds_scheduled between 1 and 15),
  round_ended       smallint check (round_ended between 1 and 15),
  time_ended        text check (time_ended ~ '^[0-9]{1,2}:[0-5][0-9]$'),
  is_title_fight    boolean not null default false,
  title_name        text check (char_length(title_name) <= 200),
  summary_fr        text,
  summary_en        text,
  cover_url         text,
  cover_alt_fr      text,
  cover_alt_en      text,
  video_url         text check (video_url is null or video_url ~* '^https?://'),
  ticket_url        text check (ticket_url is null or ticket_url ~* '^https?://'),
  is_featured       boolean not null default false,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint fights_result_iff_completed check ((fight_status = 'completed') = (result is not null)),
  constraint fights_method_requires_result check (method is null or result is not null),
  constraint fights_round_order check (round_ended is null or rounds_scheduled is null or round_ended <= rounds_scheduled),
  constraint fights_title_name check (not is_title_fight or title_name is not null),
  constraint fights_bilingual_when_published check (
    status <> 'published' or (
      (summary_fr is null) = (summary_en is null)
      and (cover_url is null or (cover_alt_fr is not null and cover_alt_en is not null))
    )
  )
);

create index fights_public_idx on public.fights (status, event_date desc);
create index fights_status_kind_idx on public.fights (fight_status, event_date);

-- Statistiques de carrière : 100 % calculées depuis les combats publiés.
-- security_invoker → la RLS de `fights` s'applique à l'appelant.
create view public.fight_stats
with (security_invoker = true)
as
select
  f.category,
  f.is_demo,
  count(*) filter (where f.fight_status = 'completed')                              as total,
  count(*) filter (where f.result = 'win')                                          as wins,
  count(*) filter (where f.result = 'loss')                                         as losses,
  count(*) filter (where f.result = 'draw')                                         as draws,
  count(*) filter (where f.result = 'no_contest')                                   as no_contests,
  count(*) filter (where f.result = 'win' and f.method in ('ko', 'tko'))            as ko_wins,
  count(*) filter (where f.is_title_fight and f.fight_status = 'completed')         as title_fights
from public.fights f
where f.status = 'published'
group by f.category, f.is_demo;

-- Palmarès / timeline --------------------------------------------------
create table public.achievements (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null default 'milestone' check (kind in ('title', 'award', 'milestone', 'record', 'other')),
  title_fr          text not null check (char_length(title_fr) between 1 and 200),
  title_en          text not null check (char_length(title_en) between 1 and 200),
  description_fr    text,
  description_en    text,
  organization      text check (char_length(organization) <= 160),
  achieved_on       date,
  year              smallint check (year between 1950 and 2100),
  fight_id          uuid references public.fights (id) on delete set null,
  image_url         text,
  image_alt_fr      text,
  image_alt_en      text,
  show_in_timeline  boolean not null default true,
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint achievements_dated check (achieved_on is not null or year is not null),
  constraint achievements_bilingual_when_published check (
    status <> 'published' or (description_fr is null) = (description_en is null)
  )
);

create index achievements_public_idx on public.achievements (status, year, sort_order);
create index achievements_fight_idx on public.achievements (fight_id);

-- Performance (préparation, entraînement, conseils) ----------------------
create table public.performance_contents (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category          text not null check (category in (
                      'preparation', 'training', 'strength', 'endurance', 'technique', 'discipline', 'nutrition', 'advice')),
  title_fr          text not null check (char_length(title_fr) between 1 and 200),
  title_en          text not null check (char_length(title_en) between 1 and 200),
  excerpt_fr        text check (char_length(excerpt_fr) <= 400),
  excerpt_en        text check (char_length(excerpt_en) <= 400),
  body_fr           text,
  body_en           text,
  cover_url         text,
  cover_alt_fr      text,
  cover_alt_en      text,
  video_url         text check (video_url is null or video_url ~* '^https?://'),
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at      timestamptz,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint performance_bilingual_when_published check (
    status <> 'published' or (
      (excerpt_fr is null) = (excerpt_en is null)
      and (body_fr is null) = (body_en is null)
      and (cover_url is null or (cover_alt_fr is not null and cover_alt_en is not null))
    )
  )
);

create index performance_public_idx on public.performance_contents (status, category, sort_order);

-- Paul Gym ---------------------------------------------------------------
create table public.gym_services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind              text not null check (kind in ('discipline', 'class', 'equipment', 'service')),
  title_fr          text not null check (char_length(title_fr) between 1 and 160),
  title_en          text not null check (char_length(title_en) between 1 and 160),
  description_fr    text,
  description_en    text,
  level             text not null default 'all' check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  image_url         text,
  image_alt_fr      text,
  image_alt_en      text,
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint gym_services_bilingual_when_published check (
    status <> 'published' or (description_fr is null) = (description_en is null)
  )
);

create index gym_services_public_idx on public.gym_services (status, kind, sort_order);

create table public.gym_coaches (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  full_name         text not null check (char_length(full_name) between 1 and 160),
  role_fr           text check (char_length(role_fr) <= 160),
  role_en           text check (char_length(role_en) <= 160),
  bio_fr            text,
  bio_en            text,
  specialties       text[] not null default '{}',
  photo_url         text,
  photo_alt_fr      text,
  photo_alt_en      text,
  instagram_url     text check (instagram_url is null or instagram_url ~* '^https?://'),
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint gym_coaches_bilingual_when_published check (
    status <> 'published' or (
      (role_fr is null) = (role_en is null)
      and (bio_fr is null) = (bio_en is null)
      and (photo_url is null or (photo_alt_fr is not null and photo_alt_en is not null))
    )
  )
);

create index gym_coaches_public_idx on public.gym_coaches (status, sort_order);

create table public.gym_schedules (
  id                uuid primary key default gen_random_uuid(),
  service_id        uuid references public.gym_services (id) on delete set null,
  coach_id          uuid references public.gym_coaches (id) on delete set null,
  label_fr          text check (char_length(label_fr) <= 160),
  label_en          text check (char_length(label_en) <= 160),
  day_of_week       smallint not null check (day_of_week between 1 and 7), -- ISO : 1 = lundi
  starts_at         time not null,
  ends_at           time not null,
  level             text not null default 'all' check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  room              text check (char_length(room) <= 80),
  capacity          smallint check (capacity > 0),
  notes_fr          text check (char_length(notes_fr) <= 300),
  notes_en          text check (char_length(notes_en) <= 300),
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint gym_schedules_time_order check (ends_at > starts_at),
  constraint gym_schedules_has_label check (service_id is not null or (label_fr is not null and label_en is not null))
);

create index gym_schedules_public_idx on public.gym_schedules (status, day_of_week, starts_at);
create index gym_schedules_service_idx on public.gym_schedules (service_id);
create index gym_schedules_coach_idx on public.gym_schedules (coach_id);

create table public.gym_memberships (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_fr           text not null check (char_length(name_fr) between 1 and 120),
  name_en           text not null check (char_length(name_en) between 1 and 120),
  description_fr    text,
  description_en    text,
  price_cents       integer check (price_cents >= 0), -- NULL = « sur demande » (jamais de tarif inventé)
  currency          text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  billing_period    text not null default 'month' check (billing_period in ('session', 'week', 'month', 'quarter', 'year', 'one_time')),
  features_fr       text[] not null default '{}',
  features_en       text[] not null default '{}',
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint gym_memberships_bilingual_when_published check (
    status <> 'published' or (
      (description_fr is null) = (description_en is null)
      and cardinality(features_fr) = cardinality(features_en)
    )
  )
);

create index gym_memberships_public_idx on public.gym_memberships (status, sort_order);

-- Commentateur -------------------------------------------------------------
create table public.commentary_events (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  event_name        text not null check (char_length(event_name) between 1 and 200),
  event_date        date,
  promotion         text check (char_length(promotion) <= 160),
  broadcaster       text check (char_length(broadcaster) <= 160),
  role              text not null default 'lead_commentator' check (role in (
                      'lead_commentator', 'color_commentator', 'analyst', 'host', 'ringside_reporter', 'other')),
  discipline        text check (char_length(discipline) <= 80),
  city              text check (char_length(city) <= 120),
  country           text check (char_length(country) <= 80),
  description_fr    text,
  description_en    text,
  cover_url         text,
  cover_alt_fr      text,
  cover_alt_en      text,
  video_url         text check (video_url is null or video_url ~* '^https?://'),
  audio_url         text check (audio_url is null or audio_url ~* '^https?://'),
  is_featured       boolean not null default false,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint commentary_events_bilingual_when_published check (
    status <> 'published' or (
      (description_fr is null) = (description_en is null)
      and (cover_url is null or (cover_alt_fr is not null and cover_alt_en is not null))
    )
  )
);

create index commentary_events_public_idx on public.commentary_events (status, event_date desc);

create table public.commentary_services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_fr          text not null check (char_length(title_fr) between 1 and 160),
  title_en          text not null check (char_length(title_en) between 1 and 160),
  description_fr    text,
  description_en    text,
  deliverables_fr   text[] not null default '{}',
  deliverables_en   text[] not null default '{}',
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint commentary_services_bilingual_when_published check (
    status <> 'published' or (
      (description_fr is null) = (description_en is null)
      and cardinality(deliverables_fr) = cardinality(deliverables_en)
    )
  )
);

create index commentary_services_public_idx on public.commentary_services (status, sort_order);

-- Médiathèque ----------------------------------------------------------------
create table public.media (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('image', 'video', 'audio')),
  category          text not null default 'other' check (category in (
                      'fight', 'training', 'gym', 'commentary', 'event', 'portrait', 'press', 'other')),
  title_fr          text check (char_length(title_fr) <= 200),
  title_en          text check (char_length(title_en) <= 200),
  alt_fr            text check (char_length(alt_fr) <= 300),
  alt_en            text check (char_length(alt_en) <= 300),
  caption_fr        text check (char_length(caption_fr) <= 500),
  caption_en        text check (char_length(caption_en) <= 500),
  storage_path      text,   -- chemin dans le bucket `media`
  external_url      text check (external_url is null or external_url ~* '^https://'),
  poster_url        text,
  width             integer check (width > 0),
  height            integer check (height > 0),
  duration_seconds  numeric(8, 2) check (duration_seconds > 0),
  taken_on          date,
  credit            text check (char_length(credit) <= 160),
  fight_id          uuid references public.fights (id) on delete set null,
  sort_order        integer not null default 0,
  is_featured       boolean not null default false,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint media_has_source check (storage_path is not null or external_url is not null),
  constraint media_image_alt check (kind <> 'image' or status <> 'published' or (alt_fr is not null and alt_en is not null)),
  constraint media_bilingual_when_published check (
    status <> 'published' or (
      (title_fr is null) = (title_en is null)
      and (caption_fr is null) = (caption_en is null)
    )
  )
);

create index media_public_idx on public.media (status, category, sort_order);
create index media_fight_idx on public.media (fight_id);

-- Actualités -----------------------------------------------------------------
create table public.articles (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category            text not null default 'news' check (category in (
                        'news', 'fight', 'gym', 'commentary', 'partnership', 'press')),
  title_fr            text not null check (char_length(title_fr) between 1 and 200),
  title_en            text not null check (char_length(title_en) between 1 and 200),
  excerpt_fr          text check (char_length(excerpt_fr) <= 400),
  excerpt_en          text check (char_length(excerpt_en) <= 400),
  body_fr             text,
  body_en             text,
  cover_url           text,
  cover_alt_fr        text,
  cover_alt_en        text,
  author_name         text check (char_length(author_name) <= 120),
  tags                text[] not null default '{}',
  seo_title_fr        text check (char_length(seo_title_fr) <= 70),
  seo_title_en        text check (char_length(seo_title_en) <= 70),
  seo_description_fr  text check (char_length(seo_description_fr) <= 170),
  seo_description_en  text check (char_length(seo_description_en) <= 170),
  is_featured         boolean not null default false,
  status              text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at        timestamptz,
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users (id) on delete set null default auth.uid(),
  search_fr           tsvector generated always as (
                        setweight(to_tsvector('french', coalesce(title_fr, '')), 'A')
                        || setweight(to_tsvector('french', coalesce(excerpt_fr, '')), 'B')
                        || setweight(to_tsvector('french', coalesce(body_fr, '')), 'C')
                      ) stored,
  search_en           tsvector generated always as (
                        setweight(to_tsvector('english', coalesce(title_en, '')), 'A')
                        || setweight(to_tsvector('english', coalesce(excerpt_en, '')), 'B')
                        || setweight(to_tsvector('english', coalesce(body_en, '')), 'C')
                      ) stored,
  constraint articles_publish_requirements check (
    status <> 'published' or (
      published_at is not null
      and body_fr is not null and body_en is not null
      and (excerpt_fr is null) = (excerpt_en is null)
      and (cover_url is null or (cover_alt_fr is not null and cover_alt_en is not null))
    )
  )
);

create index articles_public_idx on public.articles (status, published_at desc);
create index articles_category_idx on public.articles (category, published_at desc);
create index articles_search_fr_idx on public.articles using gin (search_fr);
create index articles_search_en_idx on public.articles using gin (search_en);

-- Sponsoring -----------------------------------------------------------------
-- Catégories : main = Sponsor principal, gold, silver, official = Partenaire officiel,
--              technical = Partenaire technique, media = Partenaire média, event = Sponsor d'événements
create table public.sponsorship_packages (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tier              text not null check (tier in ('main', 'gold', 'silver', 'official', 'technical', 'media', 'event')),
  name_fr           text not null check (char_length(name_fr) between 1 and 120),
  name_en           text not null check (char_length(name_en) between 1 and 120),
  description_fr    text,
  description_en    text,
  benefits_fr       text[] not null default '{}',
  benefits_en       text[] not null default '{}',
  price_cents       integer check (price_cents >= 0), -- NULL = « sur demande »
  currency          text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint sponsorship_packages_bilingual_when_published check (
    status <> 'published' or (
      (description_fr is null) = (description_en is null)
      and cardinality(benefits_fr) = cardinality(benefits_en)
    )
  )
);

create index sponsorship_packages_public_idx on public.sponsorship_packages (status, sort_order);

create table public.sponsors (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 160),
  logo_path         text,   -- chemin dans le bucket `logos`
  logo_url          text check (logo_url is null or logo_url ~* '^https://'),
  website_url       text check (website_url is null or website_url ~* '^https?://'),
  tier              text not null default 'official' check (tier in ('main', 'gold', 'silver', 'official', 'technical', 'media', 'event')),
  package_id        uuid references public.sponsorship_packages (id) on delete set null,
  description_fr    text,
  description_en    text,
  is_active         boolean not null default false,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  starts_on         date,
  ends_on           date,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint sponsors_has_logo check (not is_active or logo_path is not null or logo_url is not null),
  constraint sponsors_period check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint sponsors_bilingual check ((description_fr is null) = (description_en is null))
);

create index sponsors_public_idx on public.sponsors (is_active, sort_order);
create index sponsors_package_idx on public.sponsors (package_id);

-- Paramètres du site (ligne unique) ----------------------------------------
-- ⚠️ Lisible publiquement : n'y mettre AUCUNE donnée privée.
-- Les destinataires des notifications email sont des secrets de l'Edge Function.
create table public.site_settings (
  id                      uuid primary key default gen_random_uuid(),
  singleton               boolean not null default true unique check (singleton),
  site_name               text not null default 'PAUL',
  enabled_languages       text[] not null default '{fr,en}' check (enabled_languages <@ array['fr', 'en']::text[] and cardinality(enabled_languages) > 0),
  contact_email           text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone           text check (char_length(contact_phone) <= 40),
  booking_email           text check (booking_email is null or booking_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  gym_name                text check (char_length(gym_name) <= 120),
  gym_address             text check (char_length(gym_address) <= 240),
  gym_postal_code         text check (char_length(gym_postal_code) <= 20),
  gym_city                text check (char_length(gym_city) <= 120),
  gym_country             text check (char_length(gym_country) <= 80),
  gym_latitude            numeric(9, 6) check (gym_latitude between -90 and 90),
  gym_longitude           numeric(9, 6) check (gym_longitude between -180 and 180),
  gym_maps_url            text check (gym_maps_url is null or gym_maps_url ~* '^https://'),
  gym_opening_hours_fr    text,
  gym_opening_hours_en    text,
  instagram_url           text check (instagram_url is null or instagram_url ~* '^https://'),
  youtube_url             text check (youtube_url is null or youtube_url ~* '^https://'),
  tiktok_url              text check (tiktok_url is null or tiktok_url ~* '^https://'),
  x_url                   text check (x_url is null or x_url ~* '^https://'),
  facebook_url            text check (facebook_url is null or facebook_url ~* '^https://'),
  linkedin_url            text check (linkedin_url is null or linkedin_url ~* '^https://'),
  seo_title_fr            text check (char_length(seo_title_fr) <= 70),
  seo_title_en            text check (char_length(seo_title_en) <= 70),
  seo_description_fr      text check (char_length(seo_description_fr) <= 170),
  seo_description_en      text check (char_length(seo_description_en) <= 170),
  og_image_url            text,
  logo_url                text,
  hero_video_mp4_url      text,
  hero_video_webm_url     text,
  hero_video_mobile_url   text,
  hero_poster_url         text,
  -- Chiffres d'audience vérifiés : [{ "label_fr", "label_en", "value", "source", "verified_on" }]
  audience_metrics        jsonb not null default '[]' check (jsonb_typeof(audience_metrics) = 'array'),
  legal_notice_fr         text,
  legal_notice_en         text,
  privacy_policy_fr       text,
  privacy_policy_en       text,
  cookies_policy_fr       text,
  cookies_policy_en       text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

insert into public.site_settings (singleton) values (true);

-- Triggers updated_at ----------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'fights', 'achievements', 'performance_contents', 'gym_services', 'gym_coaches',
    'gym_schedules', 'gym_memberships', 'commentary_events', 'commentary_services', 'media',
    'articles', 'sponsorship_packages', 'sponsors', 'site_settings'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;
