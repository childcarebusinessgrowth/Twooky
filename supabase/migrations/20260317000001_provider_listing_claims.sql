-- Provider listing claims: public claim submission, document storage, fuzzy matching, admin review.
-- No auth required for submission; admin reviews and approves/rejects.

-- Claim status and match status enums
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'provider_listing_claim_status' and n.nspname = 'public') then
    create type public.provider_listing_claim_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'provider_listing_claim_match_status' and n.nspname = 'public') then
    create type public.provider_listing_claim_match_status as enum ('auto_matched', 'possible_match', 'unmatched');
  end if;
end
$$;

-- Main claims table
create table if not exists public.provider_listing_claims (
  id uuid primary key default gen_random_uuid(),
  claimant_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  business_address text not null,
  status public.provider_listing_claim_status not null default 'pending',
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  match_status public.provider_listing_claim_match_status,
  match_score numeric(5, 4),
  matched_provider_profile_id uuid references public.provider_profiles(profile_id) on delete set null,
  match_metadata jsonb,
  consent_version text not null default 'v1',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_listing_claims_status_submitted_idx
  on public.provider_listing_claims (status, submitted_at desc);
create index if not exists provider_listing_claims_matched_provider_idx
  on public.provider_listing_claims (matched_provider_profile_id)
  where matched_provider_profile_id is not null;

-- Claim documents (verification docs)
create table if not exists public.provider_listing_claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.provider_listing_claims(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  mime_type text not null,
  file_size integer not null,
  uploaded_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_listing_claim_documents_claim_id_idx
  on public.provider_listing_claim_documents (claim_id);

-- Updated_at trigger
create or replace function public.handle_provider_listing_claims_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists provider_listing_claims_set_updated_at on public.provider_listing_claims;
create trigger provider_listing_claims_set_updated_at
before update on public.provider_listing_claims
for each row execute function public.handle_provider_listing_claims_updated_at();

-- RLS
alter table public.provider_listing_claims enable row level security;
alter table public.provider_listing_claim_documents enable row level security;

-- Claims: insert allowed anonymously (public claim form); select only by admin
drop policy if exists "Provider listing claims insertable by anyone" on public.provider_listing_claims;
create policy "Provider listing claims insertable by anyone"
  on public.provider_listing_claims
  for insert
  with check (true);

drop policy if exists "Provider listing claims readable by admin only" on public.provider_listing_claims;
create policy "Provider listing claims readable by admin only"
  on public.provider_listing_claims
  for select
  using (public.is_current_user_admin());

drop policy if exists "Provider listing claims updatable by admin only" on public.provider_listing_claims;
create policy "Provider listing claims updatable by admin only"
  on public.provider_listing_claims
  for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Documents: insert via service role / admin (server action); select by admin
drop policy if exists "Provider listing claim documents insertable by service" on public.provider_listing_claim_documents;
create policy "Provider listing claim documents insertable by service"
  on public.provider_listing_claim_documents
  for insert
  with check (true);

drop policy if exists "Provider listing claim documents readable by admin only" on public.provider_listing_claim_documents;
create policy "Provider listing claim documents readable by admin only"
  on public.provider_listing_claim_documents
  for select
  using (public.is_current_user_admin());
