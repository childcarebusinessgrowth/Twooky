alter table if exists public.provider_profiles
  add column if not exists daily_fee_from integer;

alter table if exists public.provider_profiles
  add column if not exists daily_fee_to integer;

alter table if exists public.provider_profiles
  add column if not exists registration_fee integer;

alter table if exists public.provider_profiles
  add column if not exists deposit_fee integer;

alter table if exists public.provider_profiles
  add column if not exists meals_fee integer;

alter table if exists public.provider_profiles
  add column if not exists service_transport boolean not null default false;

alter table if exists public.provider_profiles
  add column if not exists service_extended_hours boolean not null default false;

alter table if exists public.provider_profiles
  add column if not exists service_pickup_dropoff boolean not null default false;

alter table if exists public.provider_profiles
  add column if not exists service_extracurriculars boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_daily_fee_non_negative'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_daily_fee_non_negative
      check (
        (daily_fee_from is null or daily_fee_from >= 0)
        and (daily_fee_to is null or daily_fee_to >= 0)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_daily_fee_range_valid'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_daily_fee_range_valid
      check (
        daily_fee_from is null
        or daily_fee_to is null
        or daily_fee_from <= daily_fee_to
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_component_fees_non_negative'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_component_fees_non_negative
      check (
        (registration_fee is null or registration_fee >= 0)
        and (deposit_fee is null or deposit_fee >= 0)
        and (meals_fee is null or meals_fee >= 0)
      );
  end if;
end $$;
