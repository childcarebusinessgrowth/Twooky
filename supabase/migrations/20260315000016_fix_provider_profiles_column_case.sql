-- Fix provider_profiles columns that may have been created with wrong casing
-- (e.g. "Virtual_tour_url" instead of "virtual_tour_url"), which causes
-- "Could not find the Virtual_tour_url column in the schema cache" on save.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'provider_profiles'
      and column_name = 'Virtual_tour_url'
  ) then
    alter table public.provider_profiles
      rename column "Virtual_tour_url" to virtual_tour_url;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'provider_profiles'
      and column_name = 'Virtual_tour_urls'
  ) then
    alter table public.provider_profiles
      rename column "Virtual_tour_urls" to virtual_tour_urls;
  end if;
end $$;
