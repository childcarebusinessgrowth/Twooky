-- Make provider notifications and review provider actions ownership-aware
-- so claimed listing owners (owner_profile_id) can access their listing data.

drop policy if exists "Providers can read own notifications" on public.provider_notifications;
create policy "Providers can read own notifications"
  on public.provider_notifications
  for select
  using (public.is_provider_owner_of(provider_profile_id));

drop policy if exists "Providers can update own notifications" on public.provider_notifications;
create policy "Providers can update own notifications"
  on public.provider_notifications
  for update
  using (public.is_provider_owner_of(provider_profile_id))
  with check (public.is_provider_owner_of(provider_profile_id));

drop policy if exists "Parent reviews updatable by provider for reply" on public.parent_reviews;
create policy "Parent reviews updatable by provider for reply"
  on public.parent_reviews
  for update
  using (public.is_provider_owner_of(provider_profile_id))
  with check (public.is_provider_owner_of(provider_profile_id));

drop policy if exists "Review reports insertable by reporter" on public.review_reports;
create policy "Review reports insertable by reporter"
  on public.review_reports
  for insert
  with check (
    reporter_profile_id = auth.uid()
    and exists (
      select 1
      from public.parent_reviews pr
      where pr.id = review_id
        and public.is_provider_owner_of(pr.provider_profile_id)
    )
  );
