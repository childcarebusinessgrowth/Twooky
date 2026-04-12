-- Cache Google review summary fields to avoid repeated Place Details calls.
alter table if exists public.provider_profiles
  add column if not exists google_rating_cached numeric;

alter table if exists public.provider_profiles
  add column if not exists google_review_count_cached integer;

alter table if exists public.provider_profiles
  add column if not exists google_reviews_url_cached text;

alter table if exists public.provider_profiles
  add column if not exists google_reviews_cached_at timestamptz;
