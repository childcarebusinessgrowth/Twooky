-- Idempotent: safe if 20260315000012_provider_notification_prefs.sql was never applied on a remote project.
alter table public.provider_profiles
  add column if not exists notify_new_inquiries boolean not null default true;
alter table public.provider_profiles
  add column if not exists notify_new_reviews boolean not null default true;
alter table public.provider_profiles
  add column if not exists notify_weekly_analytics boolean not null default true;
