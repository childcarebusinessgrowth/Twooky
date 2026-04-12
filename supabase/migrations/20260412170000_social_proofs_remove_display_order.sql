alter table if exists public.social_proofs
  drop constraint if exists social_proofs_display_order_non_negative;

alter table if exists public.social_proofs
  drop column if exists display_order;

drop index if exists social_proofs_provider_active_order_idx;

create index if not exists social_proofs_provider_active_created_idx
  on public.social_proofs (provider_profile_id, is_active, created_at desc);
