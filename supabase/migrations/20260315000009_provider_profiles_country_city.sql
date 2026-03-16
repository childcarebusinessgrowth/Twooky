-- Add location FKs to provider_profiles for provider signup (country/city from locations).
-- city text is kept for display; country_id and city_id link to locations directory.

alter table if exists public.provider_profiles
  add column if not exists country_id uuid references public.countries(id) on delete restrict;

alter table if exists public.provider_profiles
  add column if not exists city_id uuid references public.cities(id) on delete restrict;
