-- Allow providers to update their own notifications (e.g. set read_at).
drop policy if exists "Providers can update own notifications" on public.provider_notifications;
create policy "Providers can update own notifications"
  on public.provider_notifications
  for update
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());
