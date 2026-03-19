-- Provider listing documents: verification docs uploaded when provider submits listing.
-- Admin can view when reviewing listings. Bucket "provider-documents" created in app code.

create table if not exists public.provider_listing_documents (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  mime_type text not null,
  file_size integer not null,
  uploaded_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_listing_documents_profile_id_idx
  on public.provider_listing_documents (provider_profile_id);

alter table public.provider_listing_documents enable row level security;

-- Provider can insert for their own profile
drop policy if exists "Provider listing documents insertable by owner" on public.provider_listing_documents;
create policy "Provider listing documents insertable by owner"
  on public.provider_listing_documents
  for insert
  with check (provider_profile_id = auth.uid());

-- Provider can select their own; admin can select all
drop policy if exists "Provider listing documents readable by owner or admin" on public.provider_listing_documents;
create policy "Provider listing documents readable by owner or admin"
  on public.provider_listing_documents
  for select
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

-- Provider can delete their own (for draft replacement); admin can delete any
drop policy if exists "Provider listing documents deletable by owner or admin" on public.provider_listing_documents;
create policy "Provider listing documents deletable by owner or admin"
  on public.provider_listing_documents
  for delete
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );
