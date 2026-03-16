-- Ensure virtual_tour_url and virtual_tour_urls exist on provider_profiles.
-- Fixes: "column provider_profiles.virtual_tour_url does not exist"

alter table if exists public.provider_profiles
  add column if not exists virtual_tour_url text;

alter table if exists public.provider_profiles
  add column if not exists virtual_tour_urls text[];
