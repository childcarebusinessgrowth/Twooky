-- Provider-scoped blog posts for mini-sites (/site/{subdomain}/blog)

create table if not exists public.provider_blog_posts (
  id uuid primary key default gen_random_uuid(),
  provider_website_id uuid not null references public.provider_websites (id) on delete cascade,
  slug text not null,
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
  constraint provider_blog_posts_status_allowed check (status in ('draft', 'published')),
  constraint provider_blog_posts_slug_format check (
    slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$'
  )
);

create unique index if not exists provider_blog_posts_website_slug_unique_idx
  on public.provider_blog_posts (provider_website_id, lower(slug));

create index if not exists provider_blog_posts_website_status_published_idx
  on public.provider_blog_posts (provider_website_id, status, published_at desc);

create index if not exists provider_blog_posts_website_created_idx
  on public.provider_blog_posts (provider_website_id, created_at desc);

drop trigger if exists provider_blog_posts_set_updated_at on public.provider_blog_posts;
create trigger provider_blog_posts_set_updated_at
before update on public.provider_blog_posts
for each row execute function public.handle_blogs_updated_at();

alter table public.provider_blog_posts enable row level security;

-- Public: published posts only when the mini-site has been published at least once
drop policy if exists "Provider blog posts readable when published microsite" on public.provider_blog_posts;
create policy "Provider blog posts readable when published microsite"
  on public.provider_blog_posts
  for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.provider_websites w
      where w.id = provider_blog_posts.provider_website_id
        and w.published_version_id is not null
    )
  );

-- Owner: full access to posts on their website
drop policy if exists "Provider blog posts manageable by website owner" on public.provider_blog_posts;
create policy "Provider blog posts manageable by website owner"
  on public.provider_blog_posts
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = provider_blog_posts.provider_website_id
        and w.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.provider_websites w
      where w.id = provider_blog_posts.provider_website_id
        and w.profile_id = auth.uid()
    )
  );

-- Admins can read/manage all (support)
drop policy if exists "Provider blog posts admin all" on public.provider_blog_posts;
create policy "Provider blog posts admin all"
  on public.provider_blog_posts
  for all
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

comment on table public.provider_blog_posts is 'Blog posts for provider mini-sites; public reads via RLS when status=published and site is published.';
