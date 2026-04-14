-- Harden provider profile view tracking with a visitor token and daily dedupe bucket.

alter table if exists public.provider_profile_views
  add column if not exists visitor_token text;

alter table if exists public.provider_profile_views
  add column if not exists view_bucket date;

update public.provider_profile_views
set
  visitor_token = coalesce(visitor_token, 'legacy_' || encode(gen_random_bytes(16), 'hex')),
  view_bucket = coalesce(view_bucket, timezone('utc'::text, viewed_at)::date)
where visitor_token is null
   or view_bucket is null;

alter table if exists public.provider_profile_views
  alter column visitor_token set not null;

alter table if exists public.provider_profile_views
  alter column view_bucket set not null;

create unique index if not exists provider_profile_views_provider_visitor_bucket_idx
  on public.provider_profile_views (provider_profile_id, visitor_token, view_bucket);

create index if not exists provider_profile_views_provider_visitor_viewed_idx
  on public.provider_profile_views (provider_profile_id, visitor_token, viewed_at desc);
