-- Store parent child age ranges as an array so one parent can select multiple children ages.

alter table if exists public.parent_profiles
  add column if not exists child_age_groups text[] not null default '{}'::text[];

update public.parent_profiles
set child_age_groups = case
  when child_age_groups is not null and array_length(child_age_groups, 1) > 0 then child_age_groups
  when child_age_group is null or btrim(child_age_group) = '' then '{}'::text[]
  else array[
    case lower(btrim(child_age_group))
      when 'infant' then 'infant'
      when 'infants' then 'infant'
      when '0-12 months' then 'infant'
      when '0-12 month' then 'infant'
      when 'toddler' then 'toddler'
      when 'toddlers' then 'toddler'
      when '1-2 years' then 'toddler'
      when '1-2 year' then 'toddler'
      when '1-2y' then 'toddler'
      when 'preschool' then 'preschool'
      when '3-4 years' then 'preschool'
      when '3-4 year' then 'preschool'
      when 'prek' then 'prek'
      when 'pre-k' then 'prek'
      when '4-5 years' then 'prek'
      when '4-5 year' then 'prek'
      when 'school' then 'school_age'
      when 'schoolage' then 'school_age'
      when 'school_age' then 'school_age'
      when '5+' then 'school_age'
      when '5+ years' then 'school_age'
      else regexp_replace(lower(btrim(child_age_group)), '\s+', '_', 'g')
    end
  ]
end
where coalesce(array_length(child_age_groups, 1), 0) = 0;

drop function if exists public.get_provider_inquiry_previews(integer, text);

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
  child_age_groups text[],
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
    pp_parent.child_age_groups,
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
  child_age_groups text[],
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
    pp_parent.child_age_groups,
    pp_parent.preferred_start_date
  from public.parent_favorites pf
  left join public.profiles p on p.id = pf.parent_profile_id
  left join public.parent_profiles pp_parent on pp_parent.profile_id = pf.parent_profile_id
  where public.is_provider_owner_of(pf.provider_profile_id)
  order by pf.created_at desc;
end;
$$;
