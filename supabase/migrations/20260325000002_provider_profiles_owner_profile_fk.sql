-- Link provider profiles to auth-owned profiles when applicable.
-- We intentionally keep provider_profiles.profile_id decoupled to support admin-managed listings
-- that do not have an auth user / profiles row.

do $$
begin
  -- If the base schema hasn't been applied yet, skip safely.
  if to_regclass('public.provider_profiles') is null then
    return;
  end if;

  alter table public.provider_profiles
    add column if not exists owner_profile_id uuid;
end
$$;

do $$
begin
  if to_regclass('public.provider_profiles') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_owner_profile_id_fkey'
      and conrelid = 'public.provider_profiles'::regclass
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_owner_profile_id_fkey
      foreign key (owner_profile_id) references public.profiles(id) on delete cascade
      not valid;
  end if;
end
$$;

-- Backfill owner_profile_id for auth-owned provider accounts.
do $$
begin
  if to_regclass('public.provider_profiles') is null then
    return;
  end if;

  update public.provider_profiles pp
  set owner_profile_id = pp.profile_id
  where owner_profile_id is null
    and exists (
      select 1
      from public.profiles p
      where p.id = pp.profile_id
        and p.role = 'provider'
    );
end
$$;

