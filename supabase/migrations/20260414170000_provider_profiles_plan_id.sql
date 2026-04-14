-- Store the admin-assigned pricing plan for each provider profile.

alter table if exists public.provider_profiles
  add column if not exists plan_id text;

do $$
begin
  if exists (
    select 1
    from pg_class
    where oid = 'public.provider_profiles'::regclass
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_plan_id_check'
      and conrelid = 'public.provider_profiles'::regclass
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_plan_id_check
      check (
        plan_id is null
        or plan_id in ('sprout', 'grow', 'thrive', 'kinderpathPro')
      );
  end if;
end
$$;

create index if not exists provider_profiles_plan_id_idx
  on public.provider_profiles (plan_id);

comment on column public.provider_profiles.plan_id is
  'Admin-assigned pricing plan id. Allowed values: sprout, grow, thrive, kinderpathPro.';
