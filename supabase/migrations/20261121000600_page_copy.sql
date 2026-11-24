-- =====================================================================
-- PAUL — 0006 Textes de page administrables (aucun texte factuel en dur dans le code)
-- =====================================================================
alter table public.profiles
  add column commentator_bio_fr text,
  add column commentator_bio_en text,
  add constraint profiles_commentator_bilingual check (
    status <> 'published' or (commentator_bio_fr is null) = (commentator_bio_en is null)
  );

alter table public.site_settings
  add column gym_story_fr        text,
  add column gym_story_en        text,
  add column gym_hero_video_url  text,
  add column gym_hero_poster_url text,
  add constraint site_settings_gym_story_bilingual check ((gym_story_fr is null) = (gym_story_en is null));
