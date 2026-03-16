-- Allow admin-managed provider listings without requiring auth/profiles rows.
-- Keep profile_id as stable UUID primary key, but remove its FK dependency.

alter table if exists public.provider_profiles
  drop constraint if exists provider_profiles_profile_id_fkey;

do $$
declare
  provider_profile_id_attnum smallint;
  fk_name text;
begin
  select attnum
    into provider_profile_id_attnum
  from pg_attribute
  where attrelid = 'public.provider_profiles'::regclass
    and attname = 'profile_id'
    and not attisdropped;

  if provider_profile_id_attnum is null then
    return;
  end if;

  select conname
    into fk_name
  from pg_constraint
  where conrelid = 'public.provider_profiles'::regclass
    and contype = 'f'
    and conkey = array[provider_profile_id_attnum]::smallint[]
  limit 1;

  if fk_name is not null then
    execute format(
      'alter table public.provider_profiles drop constraint %I',
      fk_name
    );
  end if;
end $$;
