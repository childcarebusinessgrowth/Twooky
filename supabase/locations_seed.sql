-- Seed data for countries and cities used by the app.
-- You can run this in the Supabase SQL editor or via psql.

-- ============================================================================
-- Countries
-- ============================================================================

insert into public.countries (code, name, sort_order, is_active)
values
  ('uae', 'United Arab Emirates', 10, true)
on conflict (code) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;


-- ============================================================================
-- Cities for UAE
-- ============================================================================

-- Dubai
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
  'Dubai',
  'dubai',
  'uae',
  'dubai',
  true,
  10,
  true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set
  country_id = excluded.country_id,
  name = excluded.name,
  search_country_code = excluded.search_country_code,
  search_city_slug = excluded.search_city_slug,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Abu Dhabi
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
  'Abu Dhabi',
  'abu-dhabi',
  'uae',
  'abu-dhabi',
  true,
  20,
  true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set
  country_id = excluded.country_id,
  name = excluded.name,
  search_country_code = excluded.search_country_code,
  search_city_slug = excluded.search_city_slug,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Sharjah
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
  'Sharjah',
  'sharjah',
  'uae',
  'sharjah',
  true,
  30,
  true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set
  country_id = excluded.country_id,
  name = excluded.name,
  search_country_code = excluded.search_country_code,
  search_city_slug = excluded.search_city_slug,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

