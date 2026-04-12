-- Cache Google fallback provider images to avoid repeated photo API calls.
alter table if exists public.provider_profiles
  add column if not exists google_photo_reference_cached text;

alter table if exists public.provider_profiles
  add column if not exists google_fallback_storage_path text;

alter table if exists public.provider_profiles
  add column if not exists google_fallback_cached_at timestamptz;
