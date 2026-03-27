-- Provider microsite / website builder: draft pages + published version snapshots

-- Published versions table first (websites references it optionally)
create table if not exists public.provider_website_published_versions (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null,
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_website_published_versions_website_idx
  on public.provider_website_published_versions (website_id, created_at desc);

create table if not exists public.provider_websites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.provider_profiles (profile_id) on delete cascade,
  subdomain_slug text not null,
  template_key text,
  theme_tokens jsonb not null default '{}'::jsonb,
  nav_items jsonb not null default '[]'::jsonb,
  published_version_id uuid references public.provider_website_published_versions (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint provider_websites_subdomain_slug_format check (
    subdomain_slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  )
);

create unique index if not exists provider_websites_subdomain_slug_unique_idx
  on public.provider_websites (lower(subdomain_slug));

create index if not exists provider_websites_profile_id_idx
  on public.provider_websites (profile_id);

alter table public.provider_website_published_versions
  drop constraint if exists provider_website_published_versions_website_fk;
alter table public.provider_website_published_versions
  add constraint provider_website_published_versions_website_fk
  foreign key (website_id) references public.provider_websites (id) on delete cascade;

create table if not exists public.provider_website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.provider_websites (id) on delete cascade,
  path_slug text not null,
  title text not null default '',
  seo_title text,
  meta_description text,
  sort_order integer not null default 0,
  is_home boolean not null default false,
  canvas_nodes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint provider_website_pages_path_slug_format check (
    path_slug = '' or path_slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'
  )
);

create unique index if not exists provider_website_pages_website_path_unique_idx
  on public.provider_website_pages (website_id, lower(path_slug));

create index if not exists provider_website_pages_website_sort_idx
  on public.provider_website_pages (website_id, sort_order);

create table if not exists public.provider_website_assets (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.provider_websites (id) on delete cascade,
  storage_path text not null,
  content_type text,
  byte_size integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_website_assets_website_idx
  on public.provider_website_assets (website_id);

-- One website per provider (simplifies dashboard)
create unique index if not exists provider_websites_one_per_profile_idx
  on public.provider_websites (profile_id);

create or replace function public.handle_provider_websites_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists provider_websites_set_updated_at on public.provider_websites;
create trigger provider_websites_set_updated_at
before update on public.provider_websites
for each row execute function public.handle_provider_websites_updated_at();

create or replace function public.handle_provider_website_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists provider_website_pages_set_updated_at on public.provider_website_pages;
create trigger provider_website_pages_set_updated_at
before update on public.provider_website_pages
for each row execute function public.handle_provider_website_pages_updated_at();

-- Public read of published site (no draft leakage)
create or replace function public.get_published_provider_website(p_subdomain text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select v.snapshot
  from public.provider_websites w
  join public.provider_website_published_versions v on v.id = w.published_version_id
  where lower(w.subdomain_slug) = lower(trim(p_subdomain))
  limit 1;
$$;

grant execute on function public.get_published_provider_website(text) to anon, authenticated;

-- RLS
alter table public.provider_websites enable row level security;
alter table public.provider_website_pages enable row level security;
alter table public.provider_website_assets enable row level security;
alter table public.provider_website_published_versions enable row level security;

drop policy if exists "Provider websites owner admin all" on public.provider_websites;
create policy "Provider websites owner admin all"
  on public.provider_websites
  for all
  using (profile_id = auth.uid() or public.is_current_user_admin())
  with check (profile_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "Provider website pages owner admin via website" on public.provider_website_pages;
create policy "Provider website pages owner admin via website"
  on public.provider_website_pages
  for all
  using (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

drop policy if exists "Provider website assets owner admin via website" on public.provider_website_assets;
create policy "Provider website assets owner admin via website"
  on public.provider_website_assets
  for all
  using (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

-- Published versions: only owner/admin can insert/select list; public uses RPC
drop policy if exists "Provider website versions owner admin" on public.provider_website_published_versions;
create policy "Provider website versions owner admin"
  on public.provider_website_published_versions
  for all
  using (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1 from public.provider_websites w
      where w.id = website_id
        and (w.profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

comment on table public.provider_websites is 'Provider-built microsite; draft in pages, publish copies snapshot to published_versions';
comment on column public.provider_website_pages.canvas_nodes is 'Free-form canvas elements: [{id,type,props,layout:{desktop:{x,y,w,h},...}}]';
