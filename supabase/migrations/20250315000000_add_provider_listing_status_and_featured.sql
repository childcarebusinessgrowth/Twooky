-- Add listing_status and featured to provider_profiles for admin listings management.
-- Run this in Supabase Dashboard: SQL Editor → New query → paste and run.

alter table if exists public.provider_profiles
  add column if not exists listing_status text not null default 'pending';

alter table if exists public.provider_profiles
  add column if not exists featured boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_listing_status_allowed'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_listing_status_allowed
      check (listing_status in ('active', 'pending', 'inactive'));
  end if;
end $$;
