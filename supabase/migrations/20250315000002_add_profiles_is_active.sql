-- Add is_active to profiles for admin activate/deactivate (e.g. parent accounts).

alter table if exists public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists profiles_is_active_idx on public.profiles (is_active);
