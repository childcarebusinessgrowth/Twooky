-- Add Blog link to existing navbar JSON when missing (path blog → /site/{subdomain}/blog).
update public.provider_websites
set nav_items = nav_items || '[{"label":"Blog","path":"blog","variant":"link"}]'::jsonb
where jsonb_array_length(nav_items) > 0
  and not exists (
    select 1
    from jsonb_array_elements(nav_items) as elem
    where coalesce(elem->>'path', '') = 'blog'
  );
