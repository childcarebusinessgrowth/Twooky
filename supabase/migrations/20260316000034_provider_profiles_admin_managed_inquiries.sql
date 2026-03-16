-- Mark admin-managed (non-registered) providers so inquiry UI/APIs can disable inquiries.

alter table if exists public.provider_profiles
  add column if not exists is_admin_managed boolean not null default false;
