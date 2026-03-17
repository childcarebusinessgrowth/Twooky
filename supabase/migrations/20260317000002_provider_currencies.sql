-- Currencies directory for provider tuition display.
-- Admins manage currencies; providers select one per listing.

create table if not exists public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  symbol text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists currencies_active_idx on public.currencies (is_active, sort_order, name);

drop trigger if exists currencies_set_updated_at on public.currencies;
create trigger currencies_set_updated_at
before update on public.currencies
for each row execute function public.handle_locations_updated_at();

alter table public.currencies enable row level security;

drop policy if exists "Currencies are readable by everyone" on public.currencies;
create policy "Currencies are readable by everyone"
  on public.currencies
  for select
  using (is_active = true);

drop policy if exists "Currencies are writable by admin only" on public.currencies;
create policy "Currencies are writable by admin only"
  on public.currencies
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Add currency_id to provider_profiles
alter table if exists public.provider_profiles
  add column if not exists currency_id uuid references public.currencies(id) on delete set null;

create index if not exists provider_profiles_currency_id_idx on public.provider_profiles (currency_id);

-- Seed USD and GBP
insert into public.currencies (code, name, symbol, sort_order, is_active)
values
  ('USD', 'US Dollar', '$', 0, true),
  ('GBP', 'British Pound', '£', 1, true)
on conflict (code) do nothing;
