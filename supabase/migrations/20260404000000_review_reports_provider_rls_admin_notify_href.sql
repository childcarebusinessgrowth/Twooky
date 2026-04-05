-- Tighten review_reports insert: reporter must be the provider for that review.
-- Point admin notification link to the reviews moderation tab.

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
        and pr.provider_profile_id = auth.uid()
    )
  );

create or replace function public.notify_admin_on_review_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, message, href)
  values (
    'review_report',
    'Review reported for moderation',
    'A provider submitted a new review report.',
    '/admin/reviews?reports=1'
  );
  return new;
end;
$$;
