-- =====================================================================
-- PAUL — 0005 Storage : buckets + policies
-- =====================================================================
--   media        public  50 Mo  images / vidéos / audio du site
--   logos        public   2 Mo  logos sponsors, logo du site (SVG autorisé : upload admin uniquement)
--   attachments  privé   10 Mo  pièces jointes des demandes (PDF, images, PPTX)
--
-- Uploads publics (pièce jointe sponsoring) : PAS de policy anon. Le formulaire passera par
-- l'Edge Function `submit-request` (phase 5), qui délivre une URL d'upload signée après
-- vérification anti-spam. Le public ne peut donc ni lister, ni lire, ni écrire dans Storage.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 52428800, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav'
  ]),
  ('logos', 'logos', true, 2097152, array[
    'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'
  ]),
  ('attachments', 'attachments', false, 10485760, array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Les fichiers des buckets publics sont servis par URL publique (aucune policy SELECT
-- nécessaire, et le listing reste réservé aux admins).
create policy "storage: admin read" on storage.objects
  for select to authenticated
  using (bucket_id in ('media', 'logos', 'attachments') and (select public.is_admin()));

create policy "storage: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('media', 'logos', 'attachments') and (select public.is_admin()));

create policy "storage: admin update" on storage.objects
  for update to authenticated
  using (bucket_id in ('media', 'logos', 'attachments') and (select public.is_admin()))
  with check (bucket_id in ('media', 'logos', 'attachments') and (select public.is_admin()));

create policy "storage: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('media', 'logos', 'attachments') and (select public.is_admin()));
