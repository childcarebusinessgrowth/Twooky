-- Add Google Place ID for linking provider listings to Google reviews.

alter table if exists public.provider_profiles
  add column if not exists google_place_id text;
