-- ============================================================================
-- Locations schema: countries and cities used by the app and admin dashboard
-- ============================================================================

-- Countries represent high-level groupings for locations (e.g. USA, UK, UAE)
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- machine code, e.g. 'usa'
  name text not null,        -- display name, e.g. 'USA'
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists countries_active_idx on public.countries (is_active, sort_order);

-- Cities belong to a country and can be marked as \"popular\" for UI surfacing.
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete restrict,
  name text not null,                 -- e.g. 'New York'
  slug text not null unique,          -- e.g. 'new-york' (used for /locations/[city])
  search_country_code text not null,  -- e.g. 'usa'   (feeds search ?country=)
  search_city_slug text not null,     -- e.g. 'new-york' (feeds search ?city= or ?location=)
  is_popular boolean not null default true,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists cities_country_idx on public.cities (country_id, is_active, is_popular, sort_order);

-- Keep updated_at in sync
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

-- Enable RLS; admin access will use the service role via getSupabaseAdminClient,
-- while public access can use simple, read-only policies.
alter table public.countries enable row level security;
alter table public.cities enable row level security;

-- Public read access (safe since this is non-sensitive directory data)
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

-- Optional: write access from application clients can be restricted to admins
-- based on profiles.role, but the admin UI in this project uses the Supabase
-- service role via getSupabaseAdminClient, which bypasses RLS for writes.

