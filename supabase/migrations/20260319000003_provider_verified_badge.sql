-- Add admin-controlled Verified Provider badge fields.
alter table if exists public.provider_profiles
  add column if not exists verified_provider_badge boolean not null default false,
  add column if not exists verified_provider_badge_color text not null default 'emerald';

comment on column public.provider_profiles.verified_provider_badge is
  'Admin-assigned flag that marks the provider as Verified on public cards and profile pages.';

comment on column public.provider_profiles.verified_provider_badge_color is
  'Admin-selected color theme for the Verified Provider badge. Allowed values are enforced in app logic.';
