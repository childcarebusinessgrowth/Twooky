-- Delete parent reviews when parent profile is deleted.
-- Previously configured as ON DELETE SET NULL.

alter table public.parent_reviews
  drop constraint if exists parent_reviews_parent_profile_id_fkey;

alter table public.parent_reviews
  add constraint parent_reviews_parent_profile_id_fkey
  foreign key (parent_profile_id) references public.profiles(id) on delete cascade;

