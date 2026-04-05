-- Security Advisor: enable RLS on public.lead_follow_up_sent (PostgREST-exposed table).
-- Aligns with lead_notes in 20260318000002_provider_mini_crm.sql.
-- Service role / security definer contexts bypass RLS for cron or server jobs.

alter table public.lead_follow_up_sent enable row level security;

drop policy if exists "Lead follow-up sent readable by provider and admin" on public.lead_follow_up_sent;
create policy "Lead follow-up sent readable by provider and admin"
  on public.lead_follow_up_sent
  for select
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

drop policy if exists "Lead follow-up sent insertable by provider" on public.lead_follow_up_sent;
create policy "Lead follow-up sent insertable by provider"
  on public.lead_follow_up_sent
  for insert
  with check (provider_profile_id = auth.uid());

drop policy if exists "Lead follow-up sent updatable by provider" on public.lead_follow_up_sent;
create policy "Lead follow-up sent updatable by provider"
  on public.lead_follow_up_sent
  for update
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());

drop policy if exists "Lead follow-up sent deletable by provider" on public.lead_follow_up_sent;
create policy "Lead follow-up sent deletable by provider"
  on public.lead_follow_up_sent
  for delete
  using (provider_profile_id = auth.uid());
