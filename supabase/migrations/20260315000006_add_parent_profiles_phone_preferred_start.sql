-- Add phone and preferred start date to parent_profiles for parent settings
alter table if exists public.parent_profiles
  add column if not exists phone text;

alter table if exists public.parent_profiles
  add column if not exists preferred_start_date date;
