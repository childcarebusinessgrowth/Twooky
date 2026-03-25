-- Seed data for countries and cities used by the app.
-- You can run this in the Supabase SQL editor or via psql.

-- ============================================================================
-- Countries
-- ============================================================================

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


-- ============================================================================
-- Cities for UK
-- ============================================================================

-- London
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
select c.id, 'London', 'london', 'uk', 'london', true, 10, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Manchester
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Manchester', 'manchester', 'uk', 'manchester', true, 20, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Birmingham
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Birmingham', 'birmingham', 'uk', 'birmingham', true, 30, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Leeds
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Leeds', 'leeds', 'uk', 'leeds', true, 40, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Glasgow
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Glasgow', 'glasgow', 'uk', 'glasgow', true, 50, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Liverpool
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Liverpool', 'liverpool', 'uk', 'liverpool', true, 60, true
from public.countries c
where c.code = 'uk'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;


-- ============================================================================
-- Cities for UAE
-- ============================================================================

-- Dubai
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Dubai', 'dubai', 'uae', 'dubai', true, 10, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Abu Dhabi
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Abu Dhabi', 'abu-dhabi', 'uae', 'abu-dhabi', true, 20, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Sharjah
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Sharjah', 'sharjah', 'uae', 'sharjah', true, 30, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Ajman
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Ajman', 'ajman', 'uae', 'ajman', true, 40, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Ras Al Khaimah
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Ras Al Khaimah', 'ras-al-khaimah', 'uae', 'ras-al-khaimah', true, 50, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Fujairah
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Fujairah', 'fujairah', 'uae', 'fujairah', true, 60, true
from public.countries c
where c.code = 'uae'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;


-- ============================================================================
-- Cities for USA
-- ============================================================================

-- New York
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'New York', 'new-york', 'usa', 'new-york', true, 10, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- San Francisco
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'San Francisco', 'san-francisco', 'usa', 'san-francisco', true, 20, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Los Angeles
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Los Angeles', 'los-angeles', 'usa', 'los-angeles', true, 30, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Chicago
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Chicago', 'chicago', 'usa', 'chicago', true, 40, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Houston
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Houston', 'houston', 'usa', 'houston', true, 50, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

-- Miami
insert into public.cities (country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active)
select c.id, 'Miami', 'miami', 'usa', 'miami', true, 60, true
from public.countries c
where c.code = 'usa'
on conflict (slug) do update
set country_id = excluded.country_id,
    name = excluded.name,
    search_country_code = excluded.search_country_code,
    search_city_slug = excluded.search_city_slug,
    is_popular = excluded.is_popular,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;
