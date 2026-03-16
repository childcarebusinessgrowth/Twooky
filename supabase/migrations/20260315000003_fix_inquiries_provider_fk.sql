-- Ensure inquiry recipient is always a provider profile.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'inquiries_provider_profile_id_fkey'
      and conrelid = 'public.inquiries'::regclass
  ) then
    alter table public.inquiries
      drop constraint inquiries_provider_profile_id_fkey;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiries_provider_profile_id_fkey'
      and conrelid = 'public.inquiries'::regclass
  ) then
    alter table public.inquiries
      add constraint inquiries_provider_profile_id_fkey
      foreign key (provider_profile_id)
      references public.provider_profiles(profile_id)
      on delete cascade
      not valid;
  end if;
end
$$;
