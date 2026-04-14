-- Make Sprout the default plan for all providers.

update public.provider_profiles
set plan_id = 'sprout'
where plan_id is null;

alter table public.provider_profiles
  alter column plan_id set default 'sprout';

alter table public.provider_profiles
  alter column plan_id set not null;
