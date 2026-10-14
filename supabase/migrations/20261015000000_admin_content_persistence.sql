-- Persistance des modules admin : catégories, CMS (site/contact/réseaux sociaux),
-- bannières, guides d'achat et journal d'activité.
--
-- À exécuter une seule fois dans Supabase : Dashboard > SQL Editor > New query.
-- Le script est idempotent : il peut être relancé sans risque.
--
-- Ces tables ne sont lues et écrites que par le serveur Express (clé service_role,
-- qui ignore la RLS). La RLS est activée sans aucune policy : aucun accès direct
-- depuis le navigateur avec la clé publique (anon).

-- 1. Paramètres du site (stockage clé / valeur JSON)
--    Clés utilisées : site_cms, contact_cms, social_cms, banners_store,
--    guides_store, categories_store
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

alter table public.site_settings enable row level security;

-- 2. Journal d'activité de l'administration
create table if not exists public.admin_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_email   text,
  user_role    text,
  action       text not null,
  entity_id    text,
  entity_type  text
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;

-- Recharge le cache de schéma de l'API Supabase pour que les nouvelles tables
-- soient visibles immédiatement.
notify pgrst, 'reload schema';
