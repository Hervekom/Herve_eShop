-- Statistiques de l'espace publicitaire (carrousel de la page d'accueil).
-- Une ligne par événement : une vue (impression) ou un clic sur une publicité.
--
-- À exécuter une seule fois dans Supabase : Dashboard > SQL Editor > New query.
-- Idempotent : peut être relancé sans risque.
--
-- Écriture et lecture uniquement par le serveur (clé service_role) : RLS activée
-- sans policy, aucun accès direct depuis le navigateur.

create table if not exists public.ad_events (
  id          bigint generated always as identity primary key,
  banner_id   text not null,
  event_type  text not null check (event_type in ('impression', 'click')),
  -- Identifiant anonyme et aléatoire du navigateur (aucune donnée personnelle) :
  -- sert à compter les personnes différentes.
  visitor_id  text,
  -- Jour à l'heure du Cameroun, pour des rapports quotidiens justes.
  day         date not null default ((now() at time zone 'Africa/Douala')::date),
  created_at  timestamptz not null default now()
);

create index if not exists ad_events_banner_day_idx on public.ad_events (banner_id, day);

alter table public.ad_events enable row level security;

-- Totaux par publicité et par jour
create or replace view public.ad_stats_daily as
select
  banner_id,
  day,
  count(*) filter (where event_type = 'impression') as impressions,
  count(*) filter (where event_type = 'click')      as clicks,
  count(distinct visitor_id) filter (where event_type = 'impression') as unique_visitors
from public.ad_events
group by banner_id, day;

-- Totaux par publicité (sur toute la campagne)
create or replace view public.ad_stats_total as
select
  banner_id,
  count(*) filter (where event_type = 'impression') as impressions,
  count(*) filter (where event_type = 'click')      as clicks,
  count(distinct visitor_id) filter (where event_type = 'impression') as unique_visitors,
  min(day) as first_day,
  max(day) as last_day
from public.ad_events
group by banner_id;

-- Les vues ne doivent pas être lisibles avec la clé publique
revoke all on public.ad_stats_daily from anon, authenticated;
revoke all on public.ad_stats_total from anon, authenticated;

notify pgrst, 'reload schema';
