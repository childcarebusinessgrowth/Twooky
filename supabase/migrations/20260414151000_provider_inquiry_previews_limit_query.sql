create or replace function public.get_provider_inquiry_previews(
  p_limit integer default null,
  p_query text default null
)
returns table (
  id uuid,
  parent_profile_id uuid,
  inquiry_subject text,
  created_at timestamptz,
  updated_at timestamptz,
  parent_display_name text,
  parent_email text,
  lead_status text,
  child_age_group text,
  source text,
  first_provider_response_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_query text;
  v_limit integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return;
  end if;

  v_query := nullif(trim(coalesce(p_query, '')), '');
  v_limit := case
    when p_limit is null then 1000
    when p_limit < 1 then 1
    when p_limit > 200 then 200
    else p_limit
  end;

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
    pp_parent.child_age_group,
    i.source,
    i.first_provider_response_at
  from public.inquiries i
  left join public.profiles p on p.id = i.parent_profile_id
  left join public.parent_profiles pp_parent on pp_parent.profile_id = i.parent_profile_id
  where exists (
      select 1
      from public.provider_profiles provider
      where provider.profile_id = i.provider_profile_id
        and (provider.profile_id = v_uid or provider.owner_profile_id = v_uid)
    )
    and i.deleted_at is null
    and (
      v_query is null
      or coalesce(i.inquiry_subject, '') ilike ('%' || v_query || '%')
      or coalesce(p.display_name, '') ilike ('%' || v_query || '%')
      or coalesce(p.email, '') ilike ('%' || v_query || '%')
    )
  order by i.updated_at desc
  limit v_limit;
end;
$$;
