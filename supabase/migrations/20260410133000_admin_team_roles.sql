-- Admin team sub-roles for fine-grained admin permissions.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'admin_team_role' and n.nspname = 'public'
  ) then
    create type public.admin_team_role as enum ('base_user', 'account_manager', 'top_admin');
  end if;
end
$$;

create table if not exists public.admin_team_members (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  team_role public.admin_team_role not null default 'base_user',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  last_password_generated_at timestamptz,
  last_password_generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists admin_team_members_team_role_idx
  on public.admin_team_members (team_role, is_active);

create or replace function public.ensure_admin_team_profile_is_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.role = 'admin'::public.app_role
  ) then
    raise exception 'Admin team member must reference a profile with role=admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists admin_team_members_set_updated_at on public.admin_team_members;
create trigger admin_team_members_set_updated_at
before update on public.admin_team_members
for each row execute function public.handle_profiles_updated_at();

drop trigger if exists admin_team_members_validate_admin_profile on public.admin_team_members;
create trigger admin_team_members_validate_admin_profile
before insert or update on public.admin_team_members
for each row execute function public.ensure_admin_team_profile_is_admin();

alter table public.admin_team_members enable row level security;

drop policy if exists "Admin team members are readable by admins" on public.admin_team_members;
create policy "Admin team members are readable by admins"
  on public.admin_team_members
  for select
  using (public.is_current_user_admin());

drop policy if exists "Admin team members are writable by top-level admins" on public.admin_team_members;
create policy "Admin team members are writable by top-level admins"
  on public.admin_team_members
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Bootstrap existing admin profiles so current admins retain full access by default.
insert into public.admin_team_members (profile_id, team_role, is_active)
select p.id, 'top_admin'::public.admin_team_role, true
from public.profiles p
where p.role = 'admin'::public.app_role
  and not exists (
    select 1
    from public.admin_team_members atm
    where atm.profile_id = p.id
  );
