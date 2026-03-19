-- Add early_learning_excellence_badge to provider_profiles for admin-assignable excellence recognition.
alter table if exists public.provider_profiles
  add column if not exists early_learning_excellence_badge boolean not null default false;

comment on column public.provider_profiles.early_learning_excellence_badge is
  'Admin-assigned badge indicating Early Learning Excellence. Displayed on provider cards and detail pages.';
