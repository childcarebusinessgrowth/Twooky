-- Include parent child age group in provider inquiry previews.
-- Enables provider dashboard to show child age for signed-in parent inquiries.

drop function if exists public.get_provider_inquiry_previews();

create or replace function public.get_provider_inquiry_previews()
returns table (
  id uuid,
  parent_profile_id uuid,
  inquiry_subject text,
  created_at timestamptz,
  updated_at timestamptz,
  parent_display_name text,
  parent_email text,
  lead_status text,
  child_age_group text
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
    i.id,
    i.parent_profile_id,
    i.inquiry_subject,
    i.created_at,
    i.updated_at,
    p.display_name as parent_display_name,
    p.email as parent_email,
    i.lead_status,
    pp_parent.child_age_group
  from public.inquiries i
  left join public.profiles p on p.id = i.parent_profile_id
  left join public.parent_profiles pp_parent on pp_parent.profile_id = i.parent_profile_id
  where i.provider_profile_id = v_uid
    and i.deleted_at is null
  order by i.updated_at desc;
end;
$$;
