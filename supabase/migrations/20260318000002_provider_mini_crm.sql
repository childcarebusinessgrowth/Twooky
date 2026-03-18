-- Provider Mini CRM: source, program_interest, lead_notes, first_provider_response_at

-- 1.1 Add source to inquiries and guest_inquiries
alter table if exists public.inquiries
  add column if not exists source text;

alter table if exists public.guest_inquiries
  add column if not exists source text;

alter table if exists public.inquiries
  drop constraint if exists inquiries_source_allowed;

alter table if exists public.inquiries
  add constraint inquiries_source_allowed
  check (source is null or source in ('directory', 'compare'));

alter table if exists public.guest_inquiries
  drop constraint if exists guest_inquiries_source_allowed;

alter table if exists public.guest_inquiries
  add constraint guest_inquiries_source_allowed
  check (source is null or source in ('directory', 'compare'));

-- 1.1 Add program_interest to guest_inquiries
alter table if exists public.guest_inquiries
  add column if not exists program_interest text;

-- 1.2 Lead notes table
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  lead_type text not null check (lead_type in ('inquiry', 'guest_inquiry')),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid not null references public.profiles(id) on delete cascade
);

create index if not exists lead_notes_lead_idx on public.lead_notes (lead_type, lead_id);
create index if not exists lead_notes_provider_idx on public.lead_notes (provider_profile_id);

alter table public.lead_notes enable row level security;

drop policy if exists "Lead notes readable by provider and admin" on public.lead_notes;
create policy "Lead notes readable by provider and admin"
  on public.lead_notes
  for select
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

drop policy if exists "Lead notes insertable by provider" on public.lead_notes;
create policy "Lead notes insertable by provider"
  on public.lead_notes
  for insert
  with check (provider_profile_id = auth.uid() and created_by = auth.uid());

drop policy if exists "Lead notes updatable by provider" on public.lead_notes;
create policy "Lead notes updatable by provider"
  on public.lead_notes
  for update
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());

drop policy if exists "Lead notes deletable by provider" on public.lead_notes;
create policy "Lead notes deletable by provider"
  on public.lead_notes
  for delete
  using (provider_profile_id = auth.uid());

-- 1.3 Response time tracking
alter table if exists public.inquiries
  add column if not exists first_provider_response_at timestamptz;

comment on column public.inquiries.first_provider_response_at is
  'When provider sent first reply; used for response time analytics.';

-- Track follow-up reminders sent (avoid duplicate 48h reminders)
create table if not exists public.lead_follow_up_sent (
  lead_id uuid not null,
  lead_type text not null check (lead_type in ('inquiry', 'guest_inquiry')),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  sent_at timestamptz not null default timezone('utc'::text, now()),
  primary key (lead_id, lead_type)
);

create index if not exists lead_follow_up_sent_provider_idx on public.lead_follow_up_sent (provider_profile_id);

-- Update add_inquiry_reply to set first_provider_response_at when provider sends first message
create or replace function public.add_inquiry_reply(
  p_inquiry_id uuid,
  p_message_plain text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid;
  v_sender_type text;
  v_encrypted bytea;
  v_reply_id uuid;
  v_parent_id uuid;
  v_provider_id uuid;
begin
  v_sender_id := auth.uid();
  if v_sender_id is null then
    raise exception 'Not authenticated.';
  end if;

  select i.parent_profile_id, i.provider_profile_id
  into v_parent_id, v_provider_id
  from public.inquiries i
  where i.id = p_inquiry_id and i.deleted_at is null;

  if v_parent_id is null then
    raise exception 'Inquiry not found.';
  end if;

  if v_sender_id <> v_parent_id and v_sender_id <> v_provider_id then
    raise exception 'You are not a participant in this inquiry.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  v_sender_type := case when v_sender_id = v_parent_id then 'parent' else 'provider' end;
  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));

  insert into public.inquiry_messages (inquiry_id, sender_type, sender_profile_id, message_encrypted)
  values (p_inquiry_id, v_sender_type, v_sender_id, v_encrypted)
  returning id into v_reply_id;

  update public.inquiries
  set
    updated_at = timezone('utc'::text, now()),
    first_provider_response_at = case
      when v_sender_type = 'provider' and first_provider_response_at is null
      then timezone('utc'::text, now())
      else first_provider_response_at
    end
  where id = p_inquiry_id;

  return v_reply_id;
end;
$$;

-- Update create_inquiry to accept source
drop function if exists public.create_inquiry(uuid, text, text, boolean);

create or replace function public.create_inquiry(
  p_provider_profile_id uuid,
  p_inquiry_subject text,
  p_message_plain text,
  p_consent_to_contact boolean default true,
  p_source text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid;
  v_encrypted bytea;
  v_inquiry_id uuid;
  v_retention_days integer;
  v_consent_version text;
  v_source text;
begin
  if p_consent_to_contact is not true then
    raise exception 'Consent is required to create an inquiry.';
  end if;

  v_parent_id := auth.uid();
  if v_parent_id is null then
    raise exception 'Not authenticated.';
  end if;

  if not exists (select 1 from public.profiles where id = v_parent_id and role = 'parent') then
    raise exception 'Only parents can create inquiries.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  v_source := nullif(trim(coalesce(p_source, '')), '');
  if v_source is not null and v_source not in ('directory', 'compare') then
    v_source := 'directory';
  end if;

  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));
  v_retention_days := public.get_inquiry_retention_days();
  v_consent_version := public.get_compliance_setting('consent_version', 'v1');

  insert into public.inquiries (
    parent_profile_id,
    provider_profile_id,
    inquiry_subject,
    inquiry_message_encrypted,
    consent_to_contact,
    consent_version,
    consented_at,
    retention_until,
    source
  ) values (
    v_parent_id,
    p_provider_profile_id,
    nullif(trim(p_inquiry_subject), ''),
    v_encrypted,
    true,
    v_consent_version,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + make_interval(days => v_retention_days),
    v_source
  )
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$;

-- Update create_guest_inquiry to accept source and program_interest
drop function if exists public.create_guest_inquiry(text, date, date, text, text, text, text, text, boolean);

create or replace function public.create_guest_inquiry(
  p_provider_slug text,
  p_child_dob date,
  p_ideal_start_date date,
  p_message_plain text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_telephone text,
  p_consent_to_contact boolean default true,
  p_source text default null,
  p_program_interest text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_profile_id uuid;
  v_encrypted bytea;
  v_guest_id uuid;
  v_consent_version text;
  v_source text;
begin
  if p_consent_to_contact is not true then
    raise exception 'Consent is required to submit an inquiry.';
  end if;

  if p_message_plain is null or length(trim(p_message_plain)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'First name is required.';
  end if;

  if p_last_name is null or length(trim(p_last_name)) = 0 then
    raise exception 'Last name is required.';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email is required.';
  end if;

  if p_telephone is null or length(trim(p_telephone)) = 0 then
    raise exception 'Telephone is required.';
  end if;

  select profile_id into v_provider_profile_id
  from public.provider_profiles
  where provider_slug = p_provider_slug
  limit 1;

  if v_provider_profile_id is null then
    raise exception 'Provider not found.';
  end if;

  v_source := nullif(trim(coalesce(p_source, '')), '');
  if v_source is not null and v_source not in ('directory', 'compare') then
    v_source := 'directory';
  end if;

  v_encrypted := public.encrypt_sensitive_text(trim(p_message_plain));
  v_consent_version := public.get_compliance_setting('consent_version', 'v1');

  insert into public.guest_inquiries (
    provider_profile_id,
    child_dob,
    ideal_start_date,
    message_encrypted,
    first_name,
    last_name,
    email,
    telephone,
    consent_to_contact,
    consent_version,
    consented_at,
    source,
    program_interest
  ) values (
    v_provider_profile_id,
    p_child_dob,
    p_ideal_start_date,
    v_encrypted,
    trim(p_first_name),
    trim(p_last_name),
    trim(lower(p_email)),
    trim(p_telephone),
    true,
    v_consent_version,
    timezone('utc'::text, now()),
    v_source,
    nullif(trim(coalesce(p_program_interest, '')), '')
  )
  returning id into v_guest_id;

  return v_guest_id;
end;
$$;

-- Update get_provider_inquiry_previews to include source
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
    pp_parent.child_age_group,
    i.source,
    i.first_provider_response_at
  from public.inquiries i
  left join public.profiles p on p.id = i.parent_profile_id
  left join public.parent_profiles pp_parent on pp_parent.profile_id = i.parent_profile_id
  where i.provider_profile_id = v_uid
    and i.deleted_at is null
  order by i.updated_at desc;
end;
$$;

-- Update get_inquiry_meta_secure to include source
drop function if exists public.get_inquiry_meta_secure(uuid);

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
  lead_status text,
  source text
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
    i.lead_status,
    i.source
  from public.inquiries i
  left join public.provider_profiles pp on pp.profile_id = i.provider_profile_id
  left join public.profiles p on p.id = i.parent_profile_id
  where i.id = p_inquiry_id
    and i.deleted_at is null
  limit 1;
end;
$$;
