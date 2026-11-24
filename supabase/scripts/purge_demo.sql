-- =====================================================================
-- Supprime toutes les données de démonstration (is_demo = true).
-- À exécuter si seed.sql a été lancé par erreur sur un environnement réel.
-- =====================================================================
begin;
delete from public.gym_schedules        where is_demo;
delete from public.achievements         where is_demo;
delete from public.media                where is_demo;
delete from public.sponsors             where is_demo;
delete from public.sponsorship_packages where is_demo;
delete from public.articles             where is_demo;
delete from public.commentary_services  where is_demo;
delete from public.commentary_events    where is_demo;
delete from public.gym_memberships      where is_demo;
delete from public.gym_coaches          where is_demo;
delete from public.gym_services         where is_demo;
delete from public.performance_contents where is_demo;
delete from public.fights               where is_demo;
delete from public.profiles             where is_demo;
commit;
