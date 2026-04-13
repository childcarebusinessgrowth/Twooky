-- Rejected claim requests must carry a non-empty review reason.

update public.provider_listing_claims
set review_notes = 'Rejected by admin.'
where status = 'rejected'
  and nullif(trim(coalesce(review_notes, '')), '') is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_listing_claims_rejected_requires_review_notes'
      and conrelid = 'public.provider_listing_claims'::regclass
  ) then
    alter table public.provider_listing_claims
      add constraint provider_listing_claims_rejected_requires_review_notes
      check (
        status <> 'rejected'
        or nullif(trim(coalesce(review_notes, '')), '') is not null
      );
  end if;
end
$$;
