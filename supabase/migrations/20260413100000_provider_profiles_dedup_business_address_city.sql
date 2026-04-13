-- One-time cleanup: remove duplicate provider rows by exact business+address+city.
-- Keep the oldest provider (created_at asc, profile_id asc), delete newer duplicates.
-- Then enforce uniqueness for future writes.
with ranked as (
  select
    profile_id,
    row_number() over (
      partition by business_name, address, city
      order by created_at asc nulls last, profile_id asc
    ) as row_rank
  from public.provider_profiles
  where business_name is not null
    and address is not null
    and city is not null
),
duplicate_provider_ids as (
  select profile_id
  from ranked
  where row_rank > 1
)
delete from public.local_service_deals
where provider_id in (select profile_id from duplicate_provider_ids);

with ranked as (
  select
    profile_id,
    row_number() over (
      partition by business_name, address, city
      order by created_at asc nulls last, profile_id asc
    ) as row_rank
  from public.provider_profiles
  where business_name is not null
    and address is not null
    and city is not null
)
delete from public.provider_profiles p
using ranked r
where p.profile_id = r.profile_id
  and r.row_rank > 1;

create unique index if not exists provider_profiles_business_address_city_unique_idx
  on public.provider_profiles (business_name, address, city)
  where business_name is not null
    and address is not null
    and city is not null;

-- Optional verification after running migration:
-- select business_name, address, city, count(*)
-- from public.provider_profiles
-- where business_name is not null and address is not null and city is not null
-- group by business_name, address, city
-- having count(*) > 1;
--
-- select indexname
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'provider_profiles'
--   and indexname = 'provider_profiles_business_address_city_unique_idx';
