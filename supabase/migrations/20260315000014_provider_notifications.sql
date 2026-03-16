-- Table for provider notifications (e.g. listing confirmed by admin).
-- RLS: provider can only read their own rows.

create table if not exists public.provider_notifications (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_notifications_provider_profile_id_idx
  on public.provider_notifications (provider_profile_id);

create index if not exists provider_notifications_created_at_idx
  on public.provider_notifications (provider_profile_id, created_at desc);

alter table public.provider_notifications enable row level security;

drop policy if exists "Providers can read own notifications" on public.provider_notifications;
create policy "Providers can read own notifications"
  on public.provider_notifications
  for select
  using (provider_profile_id = auth.uid());

-- Inserts are done server-side via service role (admin action), which bypasses RLS.
