-- Add provider-managed availability status for parent-facing indicators.
alter table if exists public.provider_profiles
  add column if not exists availability_status text not null default 'openings';

alter table if exists public.provider_profiles
  add column if not exists available_spots_count integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_availability_status_allowed'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_availability_status_allowed
      check (availability_status in ('openings', 'waitlist', 'full'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_available_spots_non_negative'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_available_spots_non_negative
      check (available_spots_count is null or available_spots_count >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_availability_spots_consistency'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_availability_spots_consistency
      check (
        (availability_status = 'openings' and (available_spots_count is null or available_spots_count > 0))
        or (availability_status in ('waitlist', 'full') and available_spots_count is null)
      );
  end if;
end $$;

comment on column public.provider_profiles.availability_status is
  'Provider-managed enrollment signal shown to parents: openings, waitlist, or full.';

comment on column public.provider_profiles.available_spots_count is
  'Open enrollment spots visible to parents when availability_status is openings.';
