-- =====================================================================
-- Création du PREMIER administrateur (owner) — à exécuter UNE fois
-- =====================================================================
-- 1. Supabase Dashboard > Authentication > Users > « Add user » (email + mot de passe,
--    cocher « Auto confirm »). Il n'existe aucune inscription publique sur le site.
-- 2. Supabase Dashboard > SQL Editor : remplacer l'email ci-dessous puis exécuter.
--    (Le SQL Editor s'exécute en tant que `postgres` : la RLS ne bloque pas cette insertion.)
-- 3. Les admins suivants se créent depuis le back-office (/admin) par un owner.
-- =====================================================================

insert into public.admin_users (user_id, email, display_name, role)
select u.id, u.email, 'Owner', 'owner'
from auth.users u
where u.email = lower('CHANGE-MOI@exemple.com')
on conflict (user_id) do update set role = 'owner', is_active = true;

-- Vérification : doit renvoyer 1 ligne
select id, email, role, is_active from public.admin_users where role = 'owner';
