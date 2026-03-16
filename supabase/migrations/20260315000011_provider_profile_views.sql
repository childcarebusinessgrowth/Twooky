-- Provider profile view tracking: one row per view for dashboard "Profile Views" metric.
create table if not exists public.provider_profile_views (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_profile_views_provider_viewed_at_idx
  on public.provider_profile_views (provider_profile_id, viewed_at desc);

alter table public.provider_profile_views enable row level security;

-- Providers can read only their own view counts.
drop policy if exists "Provider profile views readable by provider" on public.provider_profile_views;
create policy "Provider profile views readable by provider"
  on public.provider_profile_views
  for select
  using (provider_profile_id = auth.uid());

-- Insert is done via API with service role (no anon insert policy to avoid abuse).
