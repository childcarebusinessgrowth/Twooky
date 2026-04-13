-- Allow claimed provider owners (owner_profile_id) to read analytics data.
-- Keeps existing admin/public behavior intact while widening provider-side reads.

drop policy if exists "Provider profile views readable by provider" on public.provider_profile_views;
create policy "Provider profile views readable by provider"
  on public.provider_profile_views
  for select
  using (public.is_provider_owner_of(provider_profile_id));

drop policy if exists "Provider websites owner read via claimed ownership" on public.provider_websites;
create policy "Provider websites owner read via claimed ownership"
  on public.provider_websites
  for select
  using (public.is_provider_owner_of(profile_id) or public.is_current_user_admin());

drop policy if exists "Provider website visits readable by owner admin" on public.provider_website_visits;
create policy "Provider website visits readable by owner admin"
  on public.provider_website_visits
  for select
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = provider_website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  );

drop policy if exists "Inquiries readable by participants and admin" on public.inquiries;
create policy "Inquiries readable by participants and admin"
  on public.inquiries
  for select
  using (
    parent_profile_id = auth.uid()
    or public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );
