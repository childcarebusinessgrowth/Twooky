-- Trigger helper for provider_blog_posts.updated_at (referenced by 20260327140000_provider_blog_posts.sql)

create or replace function public.handle_blogs_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;
