-- Supabase application schema for Early Learning Directory
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
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists profiles_role_idx on public.profiles (role);


-- Keep updated_at in sync
create or replace function public.handle_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

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
$$ language plpgsql;

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
  country_id uuid not null references public.countries(id) on delete restrict,
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

-- ============================================================================
-- 4. Provider directory catalog tables (admin-managed lookup values)
-- ============================================================================
create table if not exists public.age_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  age_range text,
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

create index if not exists age_groups_active_idx on public.age_groups (is_active, sort_order, name);
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

insert into public.age_groups (name, age_range, sort_order, is_active)
select values_table.name, values_table.age_range, values_table.sort_order, true
from (
  values
    ('Infant', '0-12 months', 10),
    ('Toddler', '1-2 years', 20),
    ('Preschool', '3-4 years', 30),
    ('Pre-K', '4-5 years', 40),
    ('School Age', '5+', 50)
) as values_table(name, age_range, sort_order)
where not exists (
  select 1 from public.age_groups existing
  where lower(existing.name) = lower(values_table.name)
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
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.provider_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
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
$$ language plpgsql security definer;

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
$$ language plpgsql stable security definer;

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
$$ language plpgsql stable security definer;

-- ============================================================================
-- 7. Inquiries table with explicit consent and retention controls
--    Message is stored encrypted using pgcrypto.
-- ============================================================================
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
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

  key_value := current_setting('app.settings.pii_encryption_key', true);
  if key_value is null or length(key_value) = 0 then
    raise exception 'Missing database setting app.settings.pii_encryption_key';
  end if;

  return pgp_sym_encrypt(plain_text, key_value, 'cipher-algo=aes256');
end;
$$ language plpgsql security definer;

create or replace function public.decrypt_sensitive_text(cipher_value bytea)
returns text as $$
declare
  key_value text;
begin
  if cipher_value is null then
    return null;
  end if;

  key_value := current_setting('app.settings.pii_encryption_key', true);
  if key_value is null or length(key_value) = 0 then
    raise exception 'Missing database setting app.settings.pii_encryption_key';
  end if;

  return pgp_sym_decrypt(cipher_value, key_value);
end;
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;

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
$$ language plpgsql security definer;


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
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  rating smallint not null,
  review_text text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint parent_reviews_rating_range check (rating >= 1 and rating <= 5),
  constraint parent_reviews_unique_parent_provider unique (parent_profile_id, provider_profile_id)
);

create index if not exists parent_reviews_parent_idx on public.parent_reviews (parent_profile_id);
create index if not exists parent_reviews_provider_idx on public.parent_reviews (provider_profile_id);

create or replace function public.handle_parent_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists parent_reviews_set_updated_at on public.parent_reviews;
create trigger parent_reviews_set_updated_at
before update on public.parent_reviews
for each row execute function public.handle_parent_reviews_updated_at();


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

-- Helper to get auth.uid() as uuid safely
create or replace function public.current_user_id()
returns uuid as $$
begin
  return auth.uid();
end;
$$ language plpgsql stable;

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

drop policy if exists "Parent reviews deletable by parent owner" on public.parent_reviews;
create policy "Parent reviews deletable by parent owner"
  on public.parent_reviews
  for delete
  using (parent_profile_id = auth.uid());


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
$$ language plpgsql security definer;

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

