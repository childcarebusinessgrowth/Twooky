-- Lock provider profile updates while listing is pending admin review.
-- Providers can still read profiles (public select policy) and edit again once active.

drop policy if exists "Provider profiles by owner or admin" on public.provider_profiles;
create policy "Provider profiles by owner or admin"
  on public.provider_profiles
  using (
    (
      profile_id = auth.uid()
      and coalesce(listing_status, 'draft') <> 'pending'
    )
    or public.is_current_user_admin()
  )
  with check (
    profile_id = auth.uid() or public.is_current_user_admin()
  );
