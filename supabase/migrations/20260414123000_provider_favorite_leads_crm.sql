-- Add provider CRM support for favorite-based leads.

-- 1) Favorite lead status on parent_favorites
alter table if exists public.parent_favorites
  add column if not exists lead_status text not null default 'new';

alter table if exists public.parent_favorites
  drop constraint if exists parent_favorites_lead_status_allowed;

alter table if exists public.parent_favorites
  add constraint parent_favorites_lead_status_allowed
  check (lead_status in ('new', 'contacted', 'tour_booked', 'waitlist', 'enrolled', 'lost'));

create index if not exists parent_favorites_provider_status_created_idx
  on public.parent_favorites (provider_profile_id, lead_status, created_at desc);

-- 2) Extend lead_notes lead_type to include favorite
alter table if exists public.lead_notes
  drop constraint if exists lead_notes_lead_type_check;

alter table if exists public.lead_notes
  add constraint lead_notes_lead_type_check
  check (lead_type in ('inquiry', 'guest_inquiry', 'favorite'));

-- 3) Provider-facing favorites CRM RPC (claimed-owner aware)
drop function if exists public.get_provider_favorite_leads();

create or replace function public.get_provider_favorite_leads()
returns table (
  id uuid,
  parent_profile_id uuid,
  provider_profile_id uuid,
  created_at timestamptz,
  lead_status text,
  parent_display_name text,
  parent_email text,
  parent_phone text,
  parent_country_name text,
  parent_city_name text,
  child_age_group text,
  preferred_start_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;

  return query
  select
    pf.id,
    pf.parent_profile_id,
    pf.provider_profile_id,
    pf.created_at,
    pf.lead_status,
    p.display_name as parent_display_name,
    p.email as parent_email,
    pp_parent.phone as parent_phone,
    p.country_name as parent_country_name,
    p.city_name as parent_city_name,
    pp_parent.child_age_group,
    pp_parent.preferred_start_date
  from public.parent_favorites pf
  left join public.profiles p on p.id = pf.parent_profile_id
  left join public.parent_profiles pp_parent on pp_parent.profile_id = pf.parent_profile_id
  where public.is_provider_owner_of(pf.provider_profile_id)
  order by pf.created_at desc;
end;
$$;

-- 4) Favorite lead status update RPC (claimed-owner aware)
drop function if exists public.update_provider_favorite_lead_status(uuid, text);

create or replace function public.update_provider_favorite_lead_status(
  p_favorite_id uuid,
  p_lead_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_updated_count integer;
begin
  v_status := nullif(trim(coalesce(p_lead_status, '')), '');
  if v_status is null then
    raise exception 'Lead status is required.';
  end if;

  if v_status not in ('new', 'contacted', 'tour_booked', 'waitlist', 'enrolled', 'lost') then
    raise exception 'Invalid lead status.';
  end if;

  update public.parent_favorites pf
  set lead_status = v_status
  where pf.id = p_favorite_id
    and public.is_provider_owner_of(pf.provider_profile_id);

  get diagnostics v_updated_count = row_count;
  return v_updated_count > 0;
end;
$$;
