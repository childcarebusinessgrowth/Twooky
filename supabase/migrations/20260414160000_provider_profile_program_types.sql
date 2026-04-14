-- Store real provider-selected program types.

create table if not exists public.provider_profile_program_types (
  provider_profile_id uuid not null
    references public.provider_profiles(profile_id) on delete cascade,
  program_type_id uuid not null
    references public.program_types(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (provider_profile_id, program_type_id)
);

create index if not exists provider_profile_program_types_program_type_idx
  on public.provider_profile_program_types (program_type_id);

create index if not exists provider_profile_program_types_profile_idx
  on public.provider_profile_program_types (provider_profile_id);

alter table public.provider_profile_program_types enable row level security;

drop policy if exists "Provider program types are readable by everyone"
  on public.provider_profile_program_types;
create policy "Provider program types are readable by everyone"
  on public.provider_profile_program_types
  for select
  using (true);

drop policy if exists "Provider program types are writable by owner or admin"
  on public.provider_profile_program_types;
create policy "Provider program types are writable by owner or admin"
  on public.provider_profile_program_types
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  )
  with check (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );
