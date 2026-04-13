-- CRUD and admin-search performance indexes.
create extension if not exists pg_trgm;

-- Faster admin search by business name / slug.
create index if not exists provider_profiles_business_name_trgm_idx
  on public.provider_profiles using gin (business_name gin_trgm_ops);

create index if not exists provider_profiles_provider_slug_trgm_idx
  on public.provider_profiles using gin (provider_slug gin_trgm_ops);

-- Faster admin listing filters and ordering.
create index if not exists provider_profiles_country_status_created_idx
  on public.provider_profiles (country_id, listing_status, created_at desc);

create index if not exists provider_profiles_status_created_idx
  on public.provider_profiles (listing_status, created_at desc);

create index if not exists provider_profiles_featured_status_created_idx
  on public.provider_profiles (featured, listing_status, created_at desc);

-- Faster primary photo lookup for list/detail pages.
create index if not exists provider_photos_profile_primary_sort_created_idx
  on public.provider_photos (provider_profile_id, is_primary, sort_order, created_at);

-- Faster doc list loading per profile in stable order.
create index if not exists provider_listing_documents_profile_uploaded_idx
  on public.provider_listing_documents (provider_profile_id, uploaded_at);

