-- Ensure provider_profiles has latitude/longitude columns used by the search map pins.
-- These columns are referenced by SELECT queries in lib/search-providers-db.ts but were not
-- previously guaranteed to exist; providers without coordinates cannot be rendered as pins.

alter table if exists public.provider_profiles
  add column if not exists latitude double precision;

alter table if exists public.provider_profiles
  add column if not exists longitude double precision;

create index if not exists provider_profiles_lat_lng_idx
  on public.provider_profiles(latitude, longitude)
  where latitude is not null and longitude is not null;
