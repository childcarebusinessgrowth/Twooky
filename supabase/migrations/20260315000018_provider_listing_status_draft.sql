-- Add "draft" onboarding status for provider listings.
-- Draft = profile can be completed and submitted by provider before admin review.

alter table if exists public.provider_profiles
  alter column listing_status set default 'draft';

alter table if exists public.provider_profiles
  drop constraint if exists provider_profiles_listing_status_allowed;

alter table if exists public.provider_profiles
  add constraint provider_profiles_listing_status_allowed
  check (listing_status in ('draft', 'active', 'pending', 'inactive'));
