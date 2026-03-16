-- Provider notification preferences (for future use: New Inquiries, New Reviews, Weekly Analytics)
alter table public.provider_profiles
  add column if not exists notify_new_inquiries boolean not null default true;
alter table public.provider_profiles
  add column if not exists notify_new_reviews boolean not null default true;
alter table public.provider_profiles
  add column if not exists notify_weekly_analytics boolean not null default true;
