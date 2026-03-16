-- Provider inquiry contact metadata helpers.
-- Exposes parent display_name/email to inquiry participants only.

create or replace function public.get_provider_inquiry_previews()
returns table (
  id uuid,
  parent_profile_id uuid,
  inquiry_subject text,
  created_at timestamptz,
  updated_at timestamptz,
  parent_display_name text,
  parent_email text
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
    p.email as parent_email
  from public.inquiries i
  left join public.profiles p on p.id = i.parent_profile_id
  where i.provider_profile_id = v_uid
    and i.deleted_at is null
  order by i.updated_at desc;
end;
$$;

create or replace function public.get_inquiry_meta_secure(p_inquiry_id uuid)
returns table (
  id uuid,
  inquiry_subject text,
  provider_business_name text,
  provider_slug text,
  parent_display_name text,
  parent_email text,
  created_at timestamptz,
  updated_at timestamptz,
  outcome text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_parent_id uuid;
  v_provider_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;

  select i.parent_profile_id, i.provider_profile_id
  into v_parent_id, v_provider_id
  from public.inquiries i
  where i.id = p_inquiry_id
    and i.deleted_at is null;

  if v_parent_id is null then
    return;
  end if;

  if v_uid <> v_parent_id and v_uid <> v_provider_id and not public.is_current_user_admin() then
    return;
  end if;

  return query
  select
    i.id,
    i.inquiry_subject,
    pp.business_name as provider_business_name,
    pp.provider_slug,
    p.display_name as parent_display_name,
    p.email as parent_email,
    i.created_at,
    i.updated_at,
    i.outcome
  from public.inquiries i
  left join public.provider_profiles pp on pp.profile_id = i.provider_profile_id
  left join public.profiles p on p.id = i.parent_profile_id
  where i.id = p_inquiry_id
    and i.deleted_at is null
  limit 1;
end;
$$;
