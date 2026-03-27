-- Published microsite visitor tracking events.
create table if not exists public.provider_website_visits (
  id uuid primary key default gen_random_uuid(),
  provider_website_id uuid not null references public.provider_websites (id) on delete cascade,
  page_slug text not null default '',
  visitor_token text not null,
  referrer text,
  user_agent text,
  visited_at timestamptz not null default timezone('utc'::text, now()),
  constraint provider_website_visits_page_slug_format check (
    page_slug = '' or page_slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'
  )
);

create index if not exists provider_website_visits_website_visited_at_idx
  on public.provider_website_visits (provider_website_id, visited_at desc);

create index if not exists provider_website_visits_website_token_visited_at_idx
  on public.provider_website_visits (provider_website_id, visitor_token, visited_at desc);

create index if not exists provider_website_visits_website_page_visited_at_idx
  on public.provider_website_visits (provider_website_id, page_slug, visited_at desc);

alter table public.provider_website_visits enable row level security;

drop policy if exists "Provider website visits readable by owner admin" on public.provider_website_visits;
create policy "Provider website visits readable by owner admin"
  on public.provider_website_visits
  for select
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = provider_website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

comment on table public.provider_website_visits is 'Append-only visit events for provider microsites (/site/{subdomain}).';
comment on column public.provider_website_visits.visitor_token is 'Anonymous token cookie used for unique visitor counting.';
