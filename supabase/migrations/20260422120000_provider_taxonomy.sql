-- Provider taxonomy: categories and provider types used across Explore and admin forms.

create table if not exists public.provider_type_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table if exists public.provider_type_categories drop column if exists slug;

create index if not exists provider_type_categories_active_idx
  on public.provider_type_categories (is_active, sort_order, name);

create or replace function public.handle_provider_type_categories_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists provider_type_categories_set_updated_at on public.provider_type_categories;
create trigger provider_type_categories_set_updated_at
before update on public.provider_type_categories
for each row execute function public.handle_provider_type_categories_updated_at();

create table if not exists public.provider_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.provider_type_categories(id) on delete restrict,
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table if exists public.provider_types drop column if exists href;
alter table if exists public.provider_types drop column if exists description;

create index if not exists provider_types_category_idx
  on public.provider_types (category_id, is_active, sort_order, name);
create index if not exists provider_types_active_idx
  on public.provider_types (is_active, sort_order, name);
create index if not exists provider_types_slug_idx
  on public.provider_types (slug);

create or replace function public.handle_provider_types_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists provider_types_set_updated_at on public.provider_types;
create trigger provider_types_set_updated_at
before update on public.provider_types
for each row execute function public.handle_provider_types_updated_at();

create table if not exists public.provider_profile_provider_types (
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  provider_type_id uuid not null references public.provider_types(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (provider_profile_id, provider_type_id)
);

create index if not exists provider_profile_provider_types_type_idx
  on public.provider_profile_provider_types (provider_type_id, provider_profile_id);

alter table public.provider_type_categories enable row level security;
alter table public.provider_types enable row level security;
alter table public.provider_profile_provider_types enable row level security;

drop policy if exists "Provider type categories are readable by everyone" on public.provider_type_categories;
create policy "Provider type categories are readable by everyone"
  on public.provider_type_categories
  for select
  using (is_active = true);

drop policy if exists "Provider types are readable by everyone" on public.provider_types;
create policy "Provider types are readable by everyone"
  on public.provider_types
  for select
  using (is_active = true);

drop policy if exists "Provider type relations are readable by everyone" on public.provider_profile_provider_types;
create policy "Provider type relations are readable by everyone"
  on public.provider_profile_provider_types
  for select
  using (true);

drop policy if exists "Provider type categories writable by admin only" on public.provider_type_categories;
create policy "Provider type categories writable by admin only"
  on public.provider_type_categories
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Provider types writable by admin only" on public.provider_types;
create policy "Provider types writable by admin only"
  on public.provider_types
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "Provider type relations writable by admin only" on public.provider_profile_provider_types;
create policy "Provider type relations writable by admin only"
  on public.provider_profile_provider_types
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

insert into public.provider_type_categories (name, sort_order, is_active)
values
  ('Providers', 10, true),
  ('Classes & activities', 20, true),
  ('Tutoring & education', 30, true),
  ('Camps', 40, true),
  ('Support', 50, true)
on conflict (name) do nothing;

with category_rows as (
  select id, name
  from public.provider_type_categories
),
seed_rows as (
  select *
  from (
    values
      ('nursery', 'Nurseries', 10, 'Providers'),
      ('preschool', 'Preschools', 20, 'Providers'),
      ('afterschool_program', 'After-school programs', 30, 'Providers'),
      ('sports_academy', 'Sports & activities', 10, 'Classes & activities'),
      ('holiday_camp', 'Holiday camps', 10, 'Camps'),
      ('tutoring', 'Tutoring', 10, 'Tutoring & education'),
      ('therapy_service', 'Therapy & support services', 10, 'Support')
  ) as v(slug, name, sort_order, category_name)
)
insert into public.provider_types (category_id, name, slug, sort_order, is_active)
select
  c.id,
  s.name,
  s.slug,
  s.sort_order,
  true
from seed_rows s
join category_rows c on c.name = s.category_name
on conflict (slug) do nothing;

insert into public.provider_profile_provider_types (provider_profile_id, provider_type_id)
select distinct
  pp.profile_id,
  pt.id
from public.provider_profiles pp
join lateral unnest(coalesce(pp.provider_types, '{}'::text[])) as raw_type(value) on true
join public.provider_types pt
  on lower(pt.slug) = lower(raw_type.value)
  or lower(pt.name) = lower(raw_type.value)
where not exists (
  select 1
  from public.provider_profile_provider_types existing
  where existing.provider_profile_id = pp.profile_id
    and existing.provider_type_id = pt.id
);

