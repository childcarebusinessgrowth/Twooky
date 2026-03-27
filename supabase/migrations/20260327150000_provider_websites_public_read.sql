-- Allow anonymous reads of published provider websites (subdomain lookup for public blog + RLS subqueries).
drop policy if exists "Provider websites public read published" on public.provider_websites;
create policy "Provider websites public read published"
  on public.provider_websites
  for select
  to anon, authenticated
  using (published_version_id is not null);
