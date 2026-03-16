-- Inquiry reply messages (thread) and RPCs for creating inquiry + adding reply.
-- First message stays in inquiries.inquiry_message_encrypted; replies go here.

create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_type text not null check (sender_type in ('parent', 'provider')),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  message_encrypted bytea not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists inquiry_messages_inquiry_id_idx on public.inquiry_messages (inquiry_id);
create index if not exists inquiry_messages_created_at_idx on public.inquiry_messages (inquiry_id, created_at);

alter table public.inquiry_messages enable row level security;

-- Participants (parent or provider of the inquiry) and admin can read
drop policy if exists "Inquiry messages readable by participants and admin" on public.inquiry_messages;
create policy "Inquiry messages readable by participants and admin"
  on public.inquiry_messages
  for select
  using (
    exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (i.parent_profile_id = auth.uid() or i.provider_profile_id = auth.uid() or public.is_current_user_admin())
    )
  );

-- Participants can insert (parent or provider); sender must be auth.uid()
drop policy if exists "Inquiry messages insertable by participants" on public.inquiry_messages;
create policy "Inquiry messages insertable by participants"
  on public.inquiry_messages
  for insert
  with check (
    sender_profile_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (i.parent_profile_id = auth.uid() or i.provider_profile_id = auth.uid())
    )
  );

-- RPC: create_inquiry (parent only). Encrypts message in DB and inserts into inquiries.
create or replace function public.create_inquiry(
  p_provider_profile_id uuid,
  p_inquiry_subject text,
  p_message_plain text,
  p_consent_to_contact boolean default true
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
    retention_until
  ) values (
    v_parent_id,
    p_provider_profile_id,
    nullif(trim(p_inquiry_subject), ''),
    v_encrypted,
    true,
    v_consent_version,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + make_interval(days => v_retention_days)
  )
  returning id into v_inquiry_id;

  return v_inquiry_id;
end;
$$;

-- RPC: add_inquiry_reply. Encrypts message in DB and inserts into inquiry_messages.
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

  -- Touch inquiry updated_at
  update public.inquiries set updated_at = timezone('utc'::text, now()) where id = p_inquiry_id;

  return v_reply_id;
end;
$$;

-- RPC: get_inquiry_thread (returns decrypted first message + replies for a participant)
create or replace function public.get_inquiry_thread(p_inquiry_id uuid)
returns table (
  message_order int,
  sender_type text,
  sender_profile_id uuid,
  body_decrypted text,
  created_at timestamptz
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
  where i.id = p_inquiry_id and i.deleted_at is null;

  if v_parent_id is null or (v_uid <> v_parent_id and v_uid <> v_provider_id and not public.is_current_user_admin()) then
    return;
  end if;

  -- First row: initial message from parent
  return query
  select
    1::int as message_order,
    'parent'::text as sender_type,
    i.parent_profile_id as sender_profile_id,
    public.decrypt_sensitive_text(i.inquiry_message_encrypted) as body_decrypted,
    i.created_at as created_at
  from public.inquiries i
  where i.id = p_inquiry_id;

  -- Subsequent rows: replies
  return query
  select
    (2 + row_number() over (order by im.created_at))::int as message_order,
    im.sender_type,
    im.sender_profile_id,
    public.decrypt_sensitive_text(im.message_encrypted) as body_decrypted,
    im.created_at
  from public.inquiry_messages im
  where im.inquiry_id = p_inquiry_id
  order by im.created_at;
end;
$$;
