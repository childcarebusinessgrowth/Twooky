-- Add onboarding_tour_shown_at to provider_profiles for tracking whether the profile tour has been shown.
alter table if exists public.provider_profiles
  add column if not exists onboarding_tour_shown_at timestamptz;

comment on column public.provider_profiles.onboarding_tour_shown_at is
  'When the provider profile update walkthrough was shown (if ever). Null means the provider has not seen the tour yet.';
