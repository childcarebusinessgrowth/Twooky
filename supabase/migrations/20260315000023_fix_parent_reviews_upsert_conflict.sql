-- Ensure ON CONFLICT (parent_profile_id, provider_profile_id) can be inferred.
-- A partial unique index cannot be inferred by this conflict target.
drop index if exists public.parent_reviews_unique_parent_provider;

create unique index if not exists parent_reviews_unique_parent_provider
  on public.parent_reviews (parent_profile_id, provider_profile_id);
