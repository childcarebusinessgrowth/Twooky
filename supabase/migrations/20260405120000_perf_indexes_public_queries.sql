-- Speed up public provider lookup by slug + active listing (common path for /providers/[slug]).
create index if not exists provider_profiles_listing_lower_slug_idx
  on public.provider_profiles (listing_status, lower(provider_slug))
  where listing_status = 'active';

-- Published blog fetch by slug (getPublishedBlogBySlug).
create index if not exists blogs_published_slug_idx
  on public.blogs (slug)
  where status = 'published';
