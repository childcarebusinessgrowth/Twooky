-- Keep parent reviews when parent (profile) is deleted: SET NULL on parent_profile_id.
-- Favorites already CASCADE (no change). Reviews remain with parent_profile_id = null.

alter table public.parent_reviews
  drop constraint if exists parent_reviews_unique_parent_provider;

alter table public.parent_reviews
  drop constraint if exists parent_reviews_parent_profile_id_fkey;

alter table public.parent_reviews
  alter column parent_profile_id drop not null;

alter table public.parent_reviews
  add constraint parent_reviews_parent_profile_id_fkey
  foreign key (parent_profile_id) references public.profiles(id) on delete set null;

create unique index parent_reviews_unique_parent_provider
  on public.parent_reviews (parent_profile_id, provider_profile_id)
  where parent_profile_id is not null;
