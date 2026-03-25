-- Reseed locations directory (countries + cities) to match UI screenshot.
-- Hard-deletes existing locations, then inserts UK/UAE/USA and popular cities.
-- Note: `provider_profiles.country_id/city_id` have FK restrict; we null them first.

begin;

-- Safety: clear provider location FKs (no-op if table empty).
do $$
begin
  if to_regclass('public.provider_profiles') is not null then
    update public.provider_profiles
    set
      country_id = null,
      city_id = null;
  end if;
end
$$;

-- Delete in FK-safe order.
delete from public.cities;
delete from public.countries;

-- Countries
insert into public.countries (code, name, sort_order, is_active)
values
  ('uk', 'United Kingdom', 10, true),
  ('uae', 'United Arab Emirates', 20, true),
  ('usa', 'United States', 30, true)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Cities (bulk insert via VALUES to keep consistent slugs/search fields)
with city_rows as (
  select *
  from (
    values
      -- UK
      ('uk', 'London', 'london', 10),
      ('uk', 'Manchester', 'manchester', 20),
      ('uk', 'Birmingham', 'birmingham', 30),
      ('uk', 'Leeds', 'leeds', 40),
      ('uk', 'Glasgow', 'glasgow', 50),
      ('uk', 'Liverpool', 'liverpool', 60),

      -- UAE
      ('uae', 'Dubai', 'dubai', 10),
      ('uae', 'Abu Dhabi', 'abu-dhabi', 20),
      ('uae', 'Sharjah', 'sharjah', 30),
      ('uae', 'Ajman', 'ajman', 40),
      ('uae', 'Ras Al Khaimah', 'ras-al-khaimah', 50),
      ('uae', 'Fujairah', 'fujairah', 60),

      -- USA
      ('usa', 'New York', 'new-york', 10),
      ('usa', 'San Francisco', 'san-francisco', 20),
      ('usa', 'Los Angeles', 'los-angeles', 30),
      ('usa', 'Chicago', 'chicago', 40),
      ('usa', 'Houston', 'houston', 50),
      ('usa', 'Miami', 'miami', 60)
  ) as v(country_code, city_name, city_slug, sort_order)
)
insert into public.cities (
  country_id,
  name,
  slug,
  search_country_code,
  search_city_slug,
  is_popular,
  sort_order,
  is_active
)
select
  c.id,
  r.city_name,
  r.city_slug,
  r.country_code,
  r.city_slug,
  true,
  r.sort_order,
  true
from city_rows r
join public.countries c
  on c.code = r.country_code
on conflict (slug) do update
set
  country_id = excluded.country_id,
  name = excluded.name,
  search_country_code = excluded.search_country_code,
  search_city_slug = excluded.search_city_slug,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

commit;

