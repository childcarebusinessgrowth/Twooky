-- Allow claimed provider owners to fully manage microsites and blog posts.
-- Also backfill legacy website rows that were linked to the claimant's own
-- provider profile instead of the claimed provider listing.

drop policy if exists "Provider websites owner admin all" on public.provider_websites;
drop policy if exists "Provider websites owner read via claimed ownership" on public.provider_websites;
create policy "Provider websites owner admin all"
  on public.provider_websites
  for all
  using (public.is_provider_owner_of(profile_id) or public.is_current_user_admin())
  with check (public.is_provider_owner_of(profile_id) or public.is_current_user_admin());

drop policy if exists "Provider website pages owner admin via website" on public.provider_website_pages;
create policy "Provider website pages owner admin via website"
  on public.provider_website_pages
  for all
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  );

drop policy if exists "Provider website assets owner admin via website" on public.provider_website_assets;
create policy "Provider website assets owner admin via website"
  on public.provider_website_assets
  for all
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  );

drop policy if exists "Provider website versions owner admin" on public.provider_website_published_versions;
create policy "Provider website versions owner admin"
  on public.provider_website_published_versions
  for all
  using (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.provider_websites w
      where w.id = website_id
        and (public.is_provider_owner_of(w.profile_id) or public.is_current_user_admin())
    )
  );

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
        and public.is_provider_owner_of(w.profile_id)
    )
  )
  with check (
    exists (
      select 1
      from public.provider_websites w
      where w.id = provider_blog_posts.provider_website_id
        and public.is_provider_owner_of(w.profile_id)
    )
  );

with unique_claim_targets as (
  select
    owner_provider.profile_id as owner_provider_profile_id,
    min(claimed_provider.profile_id) as claimed_provider_profile_id
  from public.provider_profiles owner_provider
  join public.provider_profiles claimed_provider
    on claimed_provider.owner_profile_id = owner_provider.profile_id
   and claimed_provider.profile_id <> owner_provider.profile_id
  group by owner_provider.profile_id
  having count(*) = 1
),
websites_to_move as (
  select
    w.id as website_id,
    claim_targets.claimed_provider_profile_id as target_profile_id
  from public.provider_websites w
  join unique_claim_targets claim_targets
    on claim_targets.owner_provider_profile_id = w.profile_id
  left join public.provider_websites existing_target
    on existing_target.profile_id = claim_targets.claimed_provider_profile_id
  where existing_target.id is null
)
update public.provider_websites w
set profile_id = websites_to_move.target_profile_id
from websites_to_move
where w.id = websites_to_move.website_id;
