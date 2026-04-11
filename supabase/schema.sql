-- Supabase application schema for Twooky
-- Roles, profiles, RLS policies, and admin role seeding notes.

-- ============================================================================
-- 1. Extensions and role enum
-- ============================================================================
create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role' and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('parent', 'provider', 'admin');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'admin_team_role' and n.nspname = 'public'
  ) then
    create type public.admin_team_role as enum ('base_user', 'account_manager', 'top_admin');
  end if;
end
$$;


-- ============================================================================
-- 2. Profiles table
--    One row per auth user, keyed by auth.users.id
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.app_role not null default 'parent',
  display_name text,
  -- Optional denormalized location fields for parent accounts
  country_name text,
  city_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_is_active_idx on public.profiles (is_active);


-- Keep updated_at in sync
create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
begin
  -- Allow service-role/system updates where auth context is unavailable.
  if auth.uid() is null then
    return new;
  end if;

  -- Profile owners may update safe fields, but cannot alter identity/role columns.
  if old.id = auth.uid() then
    if new.id is distinct from old.id then
      raise exception 'Changing profile id is not allowed.';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Changing profile email is not allowed.';
    end if;

    if new.role is distinct from old.role then
      raise exception 'Changing profile role is not allowed.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.handle_profiles_updated_at();

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();


-- ============================================================================
-- 3. Locations directory tables used by app/admin flows
-- ============================================================================
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
$$ language plpgsql security definer set search_path = public;

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

-- ============================================================================
-- 4. Provider directory catalog tables (admin-managed lookup values)
-- ============================================================================
create table if not exists public.age_groups (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  age_range text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.program_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.curriculum_philosophies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.provider_features (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists age_groups_active_idx on public.age_groups (is_active, sort_order, age_range);
create index if not exists program_types_active_idx on public.program_types (is_active, sort_order, name);
create index if not exists languages_active_idx on public.languages (is_active, sort_order, name);
create index if not exists curriculum_philosophies_active_idx on public.curriculum_philosophies (is_active, sort_order, name);
create index if not exists provider_features_active_idx on public.provider_features (is_active, sort_order, name);

drop trigger if exists age_groups_set_updated_at on public.age_groups;
create trigger age_groups_set_updated_at
before update on public.age_groups
for each row execute function public.handle_locations_updated_at();

drop trigger if exists program_types_set_updated_at on public.program_types;
create trigger program_types_set_updated_at
before update on public.program_types
for each row execute function public.handle_locations_updated_at();

drop trigger if exists languages_set_updated_at on public.languages;
create trigger languages_set_updated_at
before update on public.languages
for each row execute function public.handle_locations_updated_at();

drop trigger if exists curriculum_philosophies_set_updated_at on public.curriculum_philosophies;
create trigger curriculum_philosophies_set_updated_at
before update on public.curriculum_philosophies
for each row execute function public.handle_locations_updated_at();

drop trigger if exists provider_features_set_updated_at on public.provider_features;
create trigger provider_features_set_updated_at
before update on public.provider_features
for each row execute function public.handle_locations_updated_at();

alter table public.age_groups enable row level security;
alter table public.program_types enable row level security;
alter table public.languages enable row level security;
alter table public.curriculum_philosophies enable row level security;
alter table public.provider_features enable row level security;

-- Helpers are defined before policy creation so policies can reference them in one pass.
create or replace function public.current_user_has_role(expected_role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = expected_role
  );
end;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_role('admin'::public.app_role);
$$;

create table if not exists public.admin_team_members (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  team_role public.admin_team_role not null default 'base_user',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  last_password_generated_at timestamptz,
  last_password_generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists admin_team_members_team_role_idx
  on public.admin_team_members (team_role, is_active);

create or replace function public.ensure_admin_team_profile_is_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.role = 'admin'::public.app_role
  ) then
    raise exception 'Admin team member must reference a profile with role=admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_team_members_set_updated_at on public.admin_team_members;
create trigger admin_team_members_set_updated_at
before update on public.admin_team_members
for each row execute function public.handle_profiles_updated_at();

drop trigger if exists admin_team_members_validate_admin_profile on public.admin_team_members;
create trigger admin_team_members_validate_admin_profile
before insert or update on public.admin_team_members
for each row execute function public.ensure_admin_team_profile_is_admin();

alter table public.admin_team_members enable row level security;

drop policy if exists "Admin team members are readable by admins" on public.admin_team_members;
create policy "Admin team members are readable by admins"
  on public.admin_team_members
  for select
  using (public.is_current_user_admin());

drop policy if exists "Admin team members are writable by top-level admins" on public.admin_team_members;
create policy "Admin team members are writable by top-level admins"
  on public.admin_team_members
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

insert into public.admin_team_members (profile_id, team_role, is_active)
select p.id, 'top_admin'::public.admin_team_role, true
from public.profiles p
where p.role = 'admin'::public.app_role
  and not exists (
    select 1
    from public.admin_team_members atm
    where atm.profile_id = p.id
  );

drop policy if exists "Age groups are readable by everyone" on public.age_groups;
create policy "Age groups are readable by everyone"
  on public.age_groups
  for select
  using (is_active = true);

drop policy if exists "Program types are readable by everyone" on public.program_types;
create policy "Program types are readable by everyone"
  on public.program_types
  for select
  using (is_active = true);

drop policy if exists "Languages are readable by everyone" on public.languages;
create policy "Languages are readable by everyone"
  on public.languages
  for select
  using (is_active = true);

drop policy if exists "Curriculum philosophies are readable by everyone" on public.curriculum_philosophies;
create policy "Curriculum philosophies are readable by everyone"
  on public.curriculum_philosophies
  for select
  using (is_active = true);

drop policy if exists "Provider features are readable by everyone" on public.provider_features;
create policy "Provider features are readable by everyone"
  on public.provider_features
  for select
  using (is_active = true);

drop policy if exists "Age groups are writable by admin only" on public.age_groups;
create policy "Age groups are writable by admin only"
  on public.age_groups
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Program types are writable by admin only" on public.program_types;
create policy "Program types are writable by admin only"
  on public.program_types
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Languages are writable by admin only" on public.languages;
create policy "Languages are writable by admin only"
  on public.languages
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Curriculum philosophies are writable by admin only" on public.curriculum_philosophies;
create policy "Curriculum philosophies are writable by admin only"
  on public.curriculum_philosophies
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Provider features are writable by admin only" on public.provider_features;
create policy "Provider features are writable by admin only"
  on public.provider_features
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

insert into public.age_groups (tag, age_range, sort_order, is_active)
select values_table.tag, values_table.age_range, values_table.sort_order, true
from (
  values
    ('infant', '0-12 months', 10),
    ('toddler', '1-2 years', 20),
    ('preschool', '3-4 years', 30),
    ('prek', '4-5 years', 40),
    ('school_age', '5+', 50)
) as values_table(tag, age_range, sort_order)
where not exists (
  select 1 from public.age_groups existing
  where lower(existing.tag) = lower(values_table.tag)
);

insert into public.program_types (name, sort_order, is_active)
select values_table.name, values_table.sort_order, true
from (
  values
    ('Infant Care', 10),
    ('Toddler Care', 20),
    ('Preschool', 30),
    ('Pre-K', 40),
    ('Montessori', 50),
    ('Home Daycare', 60),
    ('After School', 70)
) as values_table(name, sort_order)
where not exists (
  select 1 from public.program_types existing
  where lower(existing.name) = lower(values_table.name)
);

insert into public.languages (name, sort_order, is_active)
select values_table.name, values_table.sort_order, true
from (
  values
    ('English', 10),
    ('Spanish', 20),
    ('Mandarin', 30),
    ('French', 40),
    ('German', 50)
) as values_table(name, sort_order)
where not exists (
  select 1 from public.languages existing
  where lower(existing.name) = lower(values_table.name)
);

insert into public.curriculum_philosophies (name, sort_order, is_active)
select values_table.name, values_table.sort_order, true
from (
  values
    ('Montessori', 10),
    ('Play-Based', 20),
    ('STEM-Focused', 30),
    ('Academic', 40),
    ('Reggio Emilia', 50)
) as values_table(name, sort_order)
where not exists (
  select 1 from public.curriculum_philosophies existing
  where lower(existing.name) = lower(values_table.name)
);

insert into public.provider_features (name, sort_order, is_active)
select values_table.name, values_table.sort_order, true
from (
  values
    ('Meals Included', 10),
    ('Outdoor Space', 20),
    ('Special Needs Support', 30),
    ('Transportation', 40),
    ('Flexible Hours', 50),
    ('Security Cameras', 60)
) as values_table(name, sort_order)
where not exists (
  select 1 from public.provider_features existing
  where lower(existing.name) = lower(values_table.name)
);

-- ============================================================================
-- 5. Optional extension tables for role-specific data
--    (Not strictly required yet but reserved for future use)
-- ============================================================================
create table if not exists public.parent_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  child_age_group text,
  phone text,
  preferred_start_date date,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.provider_profiles (
  profile_id uuid primary key,
  provider_slug text,
  business_name text,
  phone text,
  city text,
  virtual_tour_url text,
  virtual_tour_urls text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table if exists public.provider_profiles
  add column if not exists virtual_tour_urls text[];

alter table if exists public.provider_profiles
  add column if not exists provider_slug text;

-- Business (additional)
alter table if exists public.provider_profiles
  add column if not exists description text;
alter table if exists public.provider_profiles
  add column if not exists website text;
alter table if exists public.provider_profiles
  add column if not exists address text;
alter table if exists public.provider_profiles
  add column if not exists google_place_id text;

-- Program
alter table if exists public.provider_profiles
  add column if not exists provider_types text[];
alter table if exists public.provider_profiles
  add column if not exists age_groups_served text[];
alter table if exists public.provider_profiles
  add column if not exists curriculum_type text;
alter table if exists public.provider_profiles
  add column if not exists languages_spoken text;
alter table if exists public.provider_profiles
  add column if not exists amenities text[];

-- Operating
alter table if exists public.provider_profiles
  add column if not exists opening_time text;
alter table if exists public.provider_profiles
  add column if not exists closing_time text;
alter table if exists public.provider_profiles
  add column if not exists monthly_tuition_from integer;
alter table if exists public.provider_profiles
  add column if not exists monthly_tuition_to integer;
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
alter table if exists public.provider_profiles
  add column if not exists total_capacity integer;
alter table if exists public.provider_profiles
  add column if not exists availability_status text not null default 'openings';
alter table if exists public.provider_profiles
  add column if not exists available_spots_count integer;

-- Listing visibility for admin (active = shown on directory, pending = new, inactive = hidden)
alter table if exists public.provider_profiles
  add column if not exists listing_status text not null default 'pending';
alter table if exists public.provider_profiles
  add column if not exists featured boolean not null default false;
alter table if exists public.provider_profiles
  add column if not exists is_admin_managed boolean not null default false;

alter table if exists public.provider_profiles
  add column if not exists country_id uuid references public.countries(id) on delete restrict;
alter table if exists public.provider_profiles
  add column if not exists city_id uuid references public.cities(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_listing_status_allowed'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_listing_status_allowed
      check (listing_status in ('active', 'pending', 'inactive'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
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
    select 1 from pg_constraint
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

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_profiles_availability_status_allowed'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_availability_status_allowed
      check (availability_status in ('openings', 'waitlist', 'full'));
  end if;
end $$;

update public.provider_profiles
set provider_slug = lower(
  regexp_replace(
    regexp_replace(trim(coalesce(business_name, '')), '[^a-zA-Z0-9]+', '-', 'g'),
    '^-+|-+$',
    '',
    'g'
  )
)
where provider_slug is null
  and coalesce(trim(business_name), '') <> '';

create unique index if not exists provider_profiles_provider_slug_unique_idx
  on public.provider_profiles (provider_slug)
  where provider_slug is not null;

-- ============================================================================
-- 4b. Provider photos (facility gallery, captions, primary)
-- ============================================================================
create table if not exists public.provider_photos (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  storage_path text not null,
  caption text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists provider_photos_one_primary_per_provider_idx
  on public.provider_photos (provider_profile_id)
  where (is_primary = true);

create index if not exists provider_photos_provider_profile_idx
  on public.provider_photos (provider_profile_id);

alter table public.provider_photos enable row level security;

drop policy if exists "Provider photos are viewable by everyone" on public.provider_photos;
create policy "Provider photos are viewable by everyone"
  on public.provider_photos
  for select
  using (true);

drop policy if exists "Provider photos writable by owner" on public.provider_photos;
create policy "Provider photos writable by owner"
  on public.provider_photos
  for all
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());

-- Storage: create bucket "provider-photos" in Supabase Dashboard (public read).
-- Optional: add Storage policy so only provider can upload under folder = auth.uid();
-- If not set, the app uses the admin client to upload and enforces path = profile_id/...

-- ============================================================================
-- 5. Blogs table for admin CMS and public articles
-- ============================================================================
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content_html text not null default '',
  status text not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  seo_title text,
  meta_description text,
  cover_image_url text,
  cover_image_alt text,
  tags text[] not null default '{}',
  reading_time text not null default '3 min read',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint blogs_status_allowed check (status in ('draft', 'published'))
);

create index if not exists blogs_status_published_idx
  on public.blogs (status, published_at desc);
create index if not exists blogs_featured_idx
  on public.blogs (featured, published_at desc);
create index if not exists blogs_created_at_idx
  on public.blogs (created_at desc);

create or replace function public.handle_blogs_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists blogs_set_updated_at on public.blogs;
create trigger blogs_set_updated_at
before update on public.blogs
for each row execute function public.handle_blogs_updated_at();

alter table public.blogs enable row level security;

drop policy if exists "Blogs are readable when published or admin" on public.blogs;
create policy "Blogs are readable when published or admin"
  on public.blogs
  for select
  using (
    status = 'published'
    or public.is_current_user_admin()
  );

drop policy if exists "Blogs are writable by admin only" on public.blogs;
create policy "Blogs are writable by admin only"
  on public.blogs
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ============================================================================
-- 6. Compliance policy controls (GDPR + UAE PDPL operational settings)
-- ============================================================================
create table if not exists public.compliance_policies (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.compliance_policies (key, value, description)
values
  (
    'inquiry_retention_days',
    '365',
    'Retention period in days for inquiry message records.'
  ),
  (
    'consent_version',
    'v1',
    'Version label for current inquiry consent text.'
  )
on conflict (key) do nothing;

insert into public.compliance_policies (key, value, description)
select
  'pii_encryption_key',
  coalesce(
    nullif(current_setting('app.settings.pii_encryption_key', true), ''),
    encode(gen_random_bytes(32), 'hex')
  ),
  'Fallback symmetric key for inquiry PII encryption when app.settings.pii_encryption_key is not set.'
where not exists (
  select 1
  from public.compliance_policies
  where key = 'pii_encryption_key'
);

create or replace function public.get_compliance_setting(setting_key text, fallback_value text)
returns text as $$
declare
  setting_value text;
begin
  select value into setting_value
  from public.compliance_policies
  where key = setting_key;

  return coalesce(setting_value, fallback_value);
end;
$$ language plpgsql stable security definer set search_path = public;

create or replace function public.get_inquiry_retention_days()
returns integer as $$
declare
  raw_value text;
begin
  raw_value := public.get_compliance_setting('inquiry_retention_days', '365');
  return greatest(1, raw_value::integer);
exception
  when others then
    return 365;
end;
$$ language plpgsql stable security definer set search_path = public;

create or replace function public.get_pii_encryption_key()
returns text as $$
declare
  key_value text;
begin
  select nullif(value, '')
  into key_value
  from public.compliance_policies
  where key = 'pii_encryption_key';

  if key_value is not null then
    return key_value;
  end if;

  key_value := nullif(current_setting('app.settings.pii_encryption_key', true), '');

  if key_value is null then
    raise exception 'Missing encryption key. Set app.settings.pii_encryption_key or compliance_policies.pii_encryption_key.';
  end if;

  return key_value;
end;
$$ language plpgsql stable security definer set search_path = public;

-- ============================================================================
-- 7. Inquiries table with explicit consent and retention controls
--    Message is stored encrypted using pgcrypto.
-- ============================================================================
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  inquiry_subject text,
  inquiry_message_encrypted bytea not null,
  inquiry_message_search_hash text,
  consent_to_contact boolean not null,
  consent_version text not null,
  consented_at timestamptz not null,
  legal_basis text not null default 'consent',
  retention_until timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint inquiries_consent_required check (consent_to_contact = true),
  constraint inquiries_legal_basis_allowed check (legal_basis in ('consent', 'contract', 'legitimate_interest'))
);

create index if not exists inquiries_parent_profile_idx on public.inquiries (parent_profile_id);
create index if not exists inquiries_provider_profile_idx on public.inquiries (provider_profile_id);
create index if not exists inquiries_retention_until_idx on public.inquiries (retention_until);
create index if not exists inquiries_deleted_at_idx on public.inquiries (deleted_at);

create or replace function public.encrypt_sensitive_text(plain_text text)
returns bytea as $$
declare
  key_value text;
begin
  if plain_text is null then
    return null;
  end if;

  key_value := public.get_pii_encryption_key();

  return pgp_sym_encrypt(plain_text, key_value, 'cipher-algo=aes256');
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function public.decrypt_sensitive_text(cipher_value bytea)
returns text as $$
declare
  key_value text;
begin
  if cipher_value is null then
    return null;
  end if;

  key_value := public.get_pii_encryption_key();

  return pgp_sym_decrypt(cipher_value, key_value);
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function public.handle_inquiries_before_write()
returns trigger as $$
declare
  retention_days integer;
  expected_consent_version text;
begin
  if new.consent_to_contact is distinct from true then
    raise exception 'Consent is required before creating an inquiry.';
  end if;

  expected_consent_version := public.get_compliance_setting('consent_version', 'v1');
  if coalesce(new.consent_version, '') = '' then
    new.consent_version := expected_consent_version;
  end if;

  if new.consented_at is null then
    new.consented_at := timezone('utc'::text, now());
  end if;

  if new.retention_until is null then
    retention_days := public.get_inquiry_retention_days();
    new.retention_until := timezone('utc'::text, now()) + make_interval(days => retention_days);
  end if;

  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists inquiries_before_write on public.inquiries;
create trigger inquiries_before_write
before insert or update on public.inquiries
for each row execute function public.handle_inquiries_before_write();

create or replace function public.purge_expired_inquiries()
returns integer as $$
declare
  affected_rows integer;
begin
  update public.inquiries
  set deleted_at = timezone('utc'::text, now()),
      inquiry_message_encrypted = public.encrypt_sensitive_text('[REDACTED: RETENTION EXPIRED]'),
      inquiry_message_search_hash = null,
      updated_at = timezone('utc'::text, now())
  where retention_until < timezone('utc'::text, now())
    and deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- 7a. Inquiry messages (thread replies; first message stays in inquiries)
-- ============================================================================
create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_type text not null check (sender_type in ('parent', 'provider')),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  message_encrypted bytea not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists inquiry_messages_inquiry_id_idx on public.inquiry_messages (inquiry_id);
create index if not exists inquiry_messages_created_at_idx on public.inquiry_messages (inquiry_id, created_at);

alter table public.inquiry_messages enable row level security;

drop policy if exists "Inquiry messages readable by participants and admin" on public.inquiry_messages;
create policy "Inquiry messages readable by participants and admin"
  on public.inquiry_messages
  for select
  using (
    exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (i.parent_profile_id = auth.uid() or i.provider_profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

drop policy if exists "Inquiry messages insertable by participants" on public.inquiry_messages;
create policy "Inquiry messages insertable by participants"
  on public.inquiry_messages
  for insert
  with check (
    sender_profile_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (i.parent_profile_id = auth.uid() or i.provider_profile_id = auth.uid())
    )
  );

create or replace function public.create_inquiry(
  p_provider_profile_id uuid,
  p_inquiry_subject text,
  p_message_plain text,
  p_consent_to_contact boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid;
  v_encrypted bytea;
  v_inquiry_id uuid;
  v_retention_days integer;
  v_consent_version text;
begin
  if p_consent_to_contact is not true then
    raise exception 'Consent is required to create an inquiry.';
  end if;

  v_parent_id := auth.uid();
  if v_parent_id is null then
    raise exception 'Not authenticated.';
  end if;

  if not exists (select 1 from public.profiles where id = v_parent_id and role = 'parent') then
    raise exception 'Only parents can create inquiries.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));
  v_retention_days := public.get_inquiry_retention_days();
  v_consent_version := public.get_compliance_setting('consent_version', 'v1');

  insert into public.inquiries (
    parent_profile_id,
    provider_profile_id,
    inquiry_subject,
    inquiry_message_encrypted,
    consent_to_contact,
    consent_version,
    consented_at,
    retention_until
  ) values (
    v_parent_id,
    p_provider_profile_id,
    nullif(trim(p_inquiry_subject), ''),
    v_encrypted,
    true,
    v_consent_version,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + make_interval(days => v_retention_days)
  )
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$;

create or replace function public.add_inquiry_reply(
  p_inquiry_id uuid,
  p_message_plain text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid;
  v_sender_type text;
  v_encrypted bytea;
  v_reply_id uuid;
  v_parent_id uuid;
  v_provider_id uuid;
begin
  v_sender_id := auth.uid();
  if v_sender_id is null then
    raise exception 'Not authenticated.';
  end if;

  select i.parent_profile_id, i.provider_profile_id
  into v_parent_id, v_provider_id
  from public.inquiries i
  where i.id = p_inquiry_id and i.deleted_at is null;

  if v_parent_id is null then
    raise exception 'Inquiry not found.';
  end if;

  if v_sender_id <> v_parent_id and v_sender_id <> v_provider_id then
    raise exception 'You are not a participant in this inquiry.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  v_sender_type := case when v_sender_id = v_parent_id then 'parent' else 'provider' end;
  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));

  insert into public.inquiry_messages (inquiry_id, sender_type, sender_profile_id, message_encrypted)
  values (p_inquiry_id, v_sender_type, v_sender_id, v_encrypted)
  returning id into v_reply_id;

  update public.inquiries set updated_at = timezone('utc'::text, now()) where id = p_inquiry_id;

  return v_reply_id;
end;
$$;

create or replace function public.get_inquiry_thread(p_inquiry_id uuid)
returns table (
  message_order int,
  sender_type text,
  sender_profile_id uuid,
  body_decrypted text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_parent_id uuid;
  v_provider_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;

  select i.parent_profile_id, i.provider_profile_id
  into v_parent_id, v_provider_id
  from public.inquiries i
  where i.id = p_inquiry_id and i.deleted_at is null;

  if v_parent_id is null or (v_uid <> v_parent_id and v_uid <> v_provider_id and not public.is_current_user_admin()) then
    return;
  end if;

  return query
  select
    1::int as message_order,
    'parent'::text as sender_type,
    i.parent_profile_id as sender_profile_id,
    public.decrypt_sensitive_text(i.inquiry_message_encrypted) as body_decrypted,
    i.created_at as created_at
  from public.inquiries i
  where i.id = p_inquiry_id;

  return query
  select
    (2 + row_number() over (order by im.created_at))::int as message_order,
    im.sender_type,
    im.sender_profile_id,
    public.decrypt_sensitive_text(im.message_encrypted) as body_decrypted,
    im.created_at
  from public.inquiry_messages im
  where im.inquiry_id = p_inquiry_id
  order by im.created_at;
end;
$$;

-- ============================================================================
-- 7a2. Guest inquiries (non-logged-in parents; provider can view, cannot reply)
-- ============================================================================
create table if not exists public.guest_inquiries (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  child_dob date,
  ideal_start_date date,
  message_encrypted bytea not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  telephone text not null,
  consent_to_contact boolean not null,
  consent_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint guest_inquiries_consent_required check (consent_to_contact = true)
);

create index if not exists guest_inquiries_provider_profile_idx on public.guest_inquiries (provider_profile_id);
create index if not exists guest_inquiries_created_at_idx on public.guest_inquiries (created_at desc);

alter table public.guest_inquiries enable row level security;

drop policy if exists "Guest inquiries readable by provider and admin" on public.guest_inquiries;
create policy "Guest inquiries readable by provider and admin"
  on public.guest_inquiries
  for select
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

create or replace function public.create_guest_inquiry(
  p_provider_slug text,
  p_child_dob date,
  p_ideal_start_date date,
  p_message_plain text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_telephone text,
  p_consent_to_contact boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_profile_id uuid;
  v_encrypted bytea;
  v_guest_id uuid;
  v_consent_version text;
begin
  if p_consent_to_contact is not true then
    raise exception 'Consent is required to submit an inquiry.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'First name is required.';
  end if;

  if p_last_name is null or length(trim(p_last_name)) = 0 then
    raise exception 'Last name is required.';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email is required.';
  end if;

  if p_telephone is null or length(trim(p_telephone)) = 0 then
    raise exception 'Telephone is required.';
  end if;

  select profile_id into v_provider_profile_id
  from public.provider_profiles
  where provider_slug = p_provider_slug
  limit 1;

  if v_provider_profile_id is null then
    raise exception 'Provider not found.';
  end if;

  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));
  v_consent_version := public.get_compliance_setting('consent_version', 'v1');

  insert into public.guest_inquiries (
    provider_profile_id,
    child_dob,
    ideal_start_date,
    message_encrypted,
    first_name,
    last_name,
    email,
    telephone,
    consent_to_contact,
    consent_version,
    consented_at
  ) values (
    v_provider_profile_id,
    p_child_dob,
    p_ideal_start_date,
    v_encrypted,
    trim(p_first_name),
    trim(p_last_name),
    trim(lower(p_email)),
    trim(p_telephone),
    true,
    v_consent_version,
    timezone('utc'::text, now())
  )
  returning id into v_guest_id;

  return v_guest_id;
end;
$$;

create or replace function public.get_guest_inquiry_message_decrypted(p_guest_inquiry_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id uuid;
  v_encrypted bytea;
begin
  select gi.provider_profile_id, gi.message_encrypted
  into v_provider_id, v_encrypted
  from public.guest_inquiries gi
  where gi.id = p_guest_inquiry_id;

  if v_provider_id is null then
    return null;
  end if;

  if auth.uid() <> v_provider_id and not public.is_current_user_admin() then
    return null;
  end if;

  return public.decrypt_sensitive_text(v_encrypted);
end;
$$;

-- ============================================================================
-- 7b. Parent favorites and parent reviews (provider_profiles-linked)
-- ============================================================================
create table if not exists public.parent_favorites (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint parent_favorites_unique_parent_provider unique (parent_profile_id, provider_profile_id)
);

create index if not exists parent_favorites_parent_idx on public.parent_favorites (parent_profile_id);
create index if not exists parent_favorites_provider_idx on public.parent_favorites (provider_profile_id);

create table if not exists public.parent_reviews (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid references public.profiles(id) on delete set null,
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  rating smallint not null,
  review_text text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint parent_reviews_rating_range check (rating >= 1 and rating <= 5)
);

create unique index if not exists parent_reviews_unique_parent_provider
  on public.parent_reviews (parent_profile_id, provider_profile_id)
  where parent_profile_id is not null;
create index if not exists parent_reviews_parent_idx on public.parent_reviews (parent_profile_id);
create index if not exists parent_reviews_provider_idx on public.parent_reviews (provider_profile_id);

create or replace function public.handle_parent_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists parent_reviews_set_updated_at on public.parent_reviews;
create trigger parent_reviews_set_updated_at
before update on public.parent_reviews
for each row execute function public.handle_parent_reviews_updated_at();

-- Provider reply on reviews (nullable)
alter table public.parent_reviews
  add column if not exists provider_reply_text text,
  add column if not exists provider_replied_at timestamptz;

-- ============================================================================
-- 7c. Review reports (provider reports a parent review)
-- ============================================================================
create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.parent_reviews(id) on delete cascade,
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint review_reports_unique_reporter_review unique (review_id, reporter_profile_id)
);

create index if not exists review_reports_review_idx on public.review_reports (review_id);
create index if not exists review_reports_reporter_idx on public.review_reports (reporter_profile_id);

-- ============================================================================
-- 7d. Contact messages (site contact form submissions)
-- ============================================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  consent_to_contact boolean not null,
  consent_version text not null,
  consented_at timestamptz not null default timezone('utc'::text, now()),
  handled_status text not null default 'new',
  admin_note text,
  retention_until timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint contact_messages_handled_status_check check (handled_status in ('new', 'in_progress', 'contacted', 'resolved'))
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_handled_status_idx on public.contact_messages (handled_status);

-- ============================================================================
-- 8. RLS policies
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.compliance_policies enable row level security;
alter table public.inquiries enable row level security;
alter table public.parent_favorites enable row level security;
alter table public.parent_reviews enable row level security;
alter table public.review_reports enable row level security;
alter table public.contact_messages enable row level security;

-- Helper to get auth.uid() as uuid safely
create or replace function public.current_user_id()
returns uuid as $$
begin
  return auth.uid();
end;
$$ language plpgsql stable set search_path = public;

-- Profiles: users can see and update only their own row
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_current_user_admin());

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Parent profiles: owner or admin
drop policy if exists "Parent profiles by owner or admin" on public.parent_profiles;
create policy "Parent profiles by owner or admin"
  on public.parent_profiles
  using (
    profile_id = auth.uid() or public.is_current_user_admin()
  )
  with check (
    profile_id = auth.uid() or public.is_current_user_admin()
  );

-- Provider profiles: owner or admin
drop policy if exists "Provider profiles are viewable by everyone" on public.provider_profiles;
create policy "Provider profiles are viewable by everyone"
  on public.provider_profiles
  for select
  using (true);

drop policy if exists "Provider profiles by owner or admin" on public.provider_profiles;
create policy "Provider profiles by owner or admin"
  on public.provider_profiles
  using (
    profile_id = auth.uid() or public.is_current_user_admin()
  )
  with check (
    profile_id = auth.uid() or public.is_current_user_admin()
  );

drop policy if exists "Compliance policies readable by admin only" on public.compliance_policies;
create policy "Compliance policies readable by admin only"
  on public.compliance_policies
  for select
  using (public.is_current_user_admin());

drop policy if exists "Compliance policies writable by admin only" on public.compliance_policies;
create policy "Compliance policies writable by admin only"
  on public.compliance_policies
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Inquiries readable by participants and admin" on public.inquiries;
create policy "Inquiries readable by participants and admin"
  on public.inquiries
  for select
  using (
    parent_profile_id = auth.uid()
    or provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

drop policy if exists "Inquiries insertable by parent and admin" on public.inquiries;
create policy "Inquiries insertable by parent and admin"
  on public.inquiries
  for insert
  with check (
    (parent_profile_id = auth.uid() and consent_to_contact = true)
    or public.is_current_user_admin()
  );

drop policy if exists "Inquiries updatable by participants and admin" on public.inquiries;
create policy "Inquiries updatable by participants and admin"
  on public.inquiries
  for update
  using (
    parent_profile_id = auth.uid()
    or provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  )
  with check (
    parent_profile_id = auth.uid()
    or provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

-- Parent favorites: parents manage their own; anyone can read for display if needed
drop policy if exists "Parent favorites readable by parent" on public.parent_favorites;
create policy "Parent favorites readable by parent"
  on public.parent_favorites
  for select
  using (parent_profile_id = auth.uid());

drop policy if exists "Parent favorites insertable by parent" on public.parent_favorites;
create policy "Parent favorites insertable by parent"
  on public.parent_favorites
  for insert
  with check (
    parent_profile_id = auth.uid()
    and public.current_user_has_role('parent'::public.app_role)
  );

drop policy if exists "Parent favorites deletable by parent" on public.parent_favorites;
create policy "Parent favorites deletable by parent"
  on public.parent_favorites
  for delete
  using (parent_profile_id = auth.uid());

-- Parent reviews: parents CRUD own; everyone can read for public display
drop policy if exists "Parent reviews readable by everyone" on public.parent_reviews;
create policy "Parent reviews readable by everyone"
  on public.parent_reviews
  for select
  using (true);

drop policy if exists "Parent reviews insertable by parent" on public.parent_reviews;
create policy "Parent reviews insertable by parent"
  on public.parent_reviews
  for insert
  with check (
    parent_profile_id = auth.uid()
    and public.current_user_has_role('parent'::public.app_role)
  );

drop policy if exists "Parent reviews updatable by parent owner" on public.parent_reviews;
create policy "Parent reviews updatable by parent owner"
  on public.parent_reviews
  for update
  using (parent_profile_id = auth.uid())
  with check (parent_profile_id = auth.uid());

drop policy if exists "Parent reviews updatable by provider for reply" on public.parent_reviews;
create policy "Parent reviews updatable by provider for reply"
  on public.parent_reviews
  for update
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());

drop policy if exists "Parent reviews deletable by parent owner" on public.parent_reviews;
create policy "Parent reviews deletable by parent owner"
  on public.parent_reviews
  for delete
  using (parent_profile_id = auth.uid());

-- Review reports: provider can insert own report; admin can read
drop policy if exists "Review reports insertable by reporter" on public.review_reports;
create policy "Review reports insertable by reporter"
  on public.review_reports
  for insert
  with check (
    reporter_profile_id = auth.uid()
    and exists (
      select 1
      from public.parent_reviews pr
      where pr.id = review_id
        and pr.provider_profile_id = auth.uid()
    )
  );

drop policy if exists "Review reports readable by admin" on public.review_reports;
create policy "Review reports readable by admin"
  on public.review_reports
  for select
  using (public.is_current_user_admin());

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  using (public.is_current_user_admin());


-- ============================================================================
-- 9. Trigger to create profile on auth.users insert
--    Allows user-selected role only for parent/provider; admin is set manually.
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  new_role public.app_role;
  initial_display_name text;
begin
  -- Determine role from raw_user_meta_data.role when explicitly parent/provider.
  if new.raw_user_meta_data ? 'role' and (new.raw_user_meta_data->>'role') in ('parent', 'provider') then
    new_role := (new.raw_user_meta_data->>'role')::public.app_role;
  else
    new_role := 'parent';
  end if;

  if new_role = 'provider' then
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'business_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'Provider'
    );
  elsif new_role = 'parent' then
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'Parent'
    );
  else
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      new.email
    );
  end if;

  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    new_role,
    initial_display_name
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill existing rows where display_name is still email/null.
update public.profiles p
set display_name = case
    when p.role = 'provider' then coalesce(
      nullif(trim(u.raw_user_meta_data->>'business_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'name'), ''),
      p.display_name
    )
    when p.role = 'parent' then coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'name'), ''),
      p.display_name
    )
    else coalesce(
      nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'name'), ''),
      p.display_name
    )
  end,
  updated_at = timezone('utc'::text, now())
from auth.users u
where u.id = p.id
  and (p.display_name is null or p.display_name = p.email);

-- ============================================================================
-- 9b. Sponsors & Advertisers (admin-managed discounts + local service deals)
-- ============================================================================
create table if not exists public.sponsor_discounts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null,
  discount_code text,
  external_link text,
  category text not null,
  offer_badge text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.sponsor_discounts
  add column if not exists offer_badge text;

create index if not exists sponsor_discounts_active_sort_idx
  on public.sponsor_discounts (is_active, sort_order, created_at desc);

create table if not exists public.local_service_deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null,
  location text not null,
  age_target text not null,
  provider_id uuid not null references public.provider_profiles(profile_id) on delete restrict,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists local_service_deals_active_sort_idx
  on public.local_service_deals (is_active, sort_order, created_at desc);

create index if not exists local_service_deals_provider_idx
  on public.local_service_deals (provider_id);

create or replace function public.handle_sponsor_content_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists sponsor_discounts_set_updated_at on public.sponsor_discounts;
create trigger sponsor_discounts_set_updated_at
before update on public.sponsor_discounts
for each row execute function public.handle_sponsor_content_updated_at();

drop trigger if exists local_service_deals_set_updated_at on public.local_service_deals;
create trigger local_service_deals_set_updated_at
before update on public.local_service_deals
for each row execute function public.handle_sponsor_content_updated_at();

alter table public.sponsor_discounts enable row level security;
alter table public.local_service_deals enable row level security;

drop policy if exists "Sponsor discounts are readable when active" on public.sponsor_discounts;
create policy "Sponsor discounts are readable when active"
  on public.sponsor_discounts
  for select
  using (is_active = true);

drop policy if exists "Sponsor discounts are writable by admin only" on public.sponsor_discounts;
create policy "Sponsor discounts are writable by admin only"
  on public.sponsor_discounts
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Local service deals are readable when active" on public.local_service_deals;
create policy "Local service deals are readable when active"
  on public.local_service_deals
  for select
  using (is_active = true);

drop policy if exists "Local service deals are writable by admin only" on public.local_service_deals;
create policy "Local service deals are writable by admin only"
  on public.local_service_deals
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ============================================================================
-- 10. Admin role seeding notes
-- ============================================================================
-- To create an admin user:
--
-- 1. In the Supabase dashboard, go to Authentication > Users.
-- 2. Manually create a new user with:
--      email:    <admin-email@example.com>
--      password: <generate-a-strong-random-password>
--    Alternatively, create it via the Auth API in your backend using the
--    service role key.
-- 3. After the user is created, note the user's UUID (id) from the dashboard.
-- 4. Promote the user by updating the profile role to admin (server-side only).
-- 5. Once this schema and trigger are applied, the profile row in
--    public.profiles can be elevated to role = 'admin' manually when needed:
--
--      update public.profiles
--      set role = 'admin'
--      where id = '<PASTE-ADMIN-USER-ID-HERE>';
--
-- Do NOT store the password in SQL; passwords are managed solely by Supabase Auth.

-- ============================================================================
-- 11. Provider website builder (see migration 20260325120001_provider_website_builder.sql)
-- ============================================================================
-- Tables: provider_websites, provider_website_pages, provider_website_assets,
--         provider_website_published_versions
-- RPC: get_published_provider_website(subdomain) for public reads of published snapshots.
-- Storage bucket: provider-website-assets (created at upload time via admin client).

