create table if not exists public.directory_badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_badges_name_unique unique (name)
);

create table if not exists public.provider_profile_badges (
  provider_profile_id uuid not null references public.provider_profiles (profile_id) on delete cascade,
  badge_id uuid not null references public.directory_badges (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider_profile_id, badge_id)
);

create index if not exists idx_directory_badges_is_active on public.directory_badges (is_active);
create index if not exists idx_directory_badges_sort_order on public.directory_badges (sort_order);
create index if not exists idx_provider_profile_badges_provider_profile_id on public.provider_profile_badges (provider_profile_id);
create index if not exists idx_provider_profile_badges_badge_id on public.provider_profile_badges (badge_id);
