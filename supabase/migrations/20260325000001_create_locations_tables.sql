-- Create countries/cities directory tables used by the app.
-- This is required before running the locations seed/reseed scripts.

begin;

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists countries_active_idx on public.countries (is_active, sort_order);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  slug text not null unique,
  search_country_code text not null,
  search_city_slug text not null,
  is_popular boolean not null default true,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists cities_country_idx on public.cities (country_id, is_active, is_popular, sort_order);

create or replace function public.handle_locations_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists countries_set_updated_at on public.countries;
create trigger countries_set_updated_at
before update on public.countries
for each row execute function public.handle_locations_updated_at();

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
before update on public.cities
for each row execute function public.handle_locations_updated_at();

alter table public.countries enable row level security;
alter table public.cities enable row level security;

drop policy if exists "Countries are readable by everyone" on public.countries;
create policy "Countries are readable by everyone"
  on public.countries
  for select
  using (is_active = true);

drop policy if exists "Cities are readable by everyone" on public.cities;
create policy "Cities are readable by everyone"
  on public.cities
  for select
  using (is_active = true);

commit;

