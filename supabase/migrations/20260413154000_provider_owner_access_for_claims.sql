-- Allow claimed-listing owners (owner_profile_id) to manage provider data and inquiries.

do $$
begin
  if to_regclass('public.provider_profiles') is null then
    return;
  end if;

  alter table public.provider_profiles
    add column if not exists owner_profile_id uuid;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_profiles_owner_profile_id_fkey'
      and conrelid = 'public.provider_profiles'::regclass
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_owner_profile_id_fkey
      foreign key (owner_profile_id) references public.profiles(id) on delete cascade
      not valid;
  end if;
end
$$;

update public.provider_profiles
set owner_profile_id = profile_id
where owner_profile_id is null
  and exists (
    select 1
    from public.profiles p
    where p.id = public.provider_profiles.profile_id
      and p.role = 'provider'
  );

create or replace function public.is_provider_owner_of(p_provider_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.provider_profiles pp
    where pp.profile_id = p_provider_profile_id
      and (
        pp.profile_id = auth.uid()
        or pp.owner_profile_id = auth.uid()
      )
  );
$$;

drop policy if exists "Provider profiles by owner or admin" on public.provider_profiles;
create policy "Provider profiles by owner or admin"
  on public.provider_profiles
  using (
    (
      public.is_provider_owner_of(profile_id)
      and coalesce(listing_status, 'draft') <> 'pending'
    )
    or public.is_current_user_admin()
  )
  with check (
    public.is_provider_owner_of(profile_id)
    or public.is_current_user_admin()
  );

drop policy if exists "Provider FAQs writable by owner" on public.provider_faqs;
create policy "Provider FAQs writable by owner"
  on public.provider_faqs
  for all
  using (public.is_provider_owner_of(provider_profile_id))
  with check (public.is_provider_owner_of(provider_profile_id));

drop policy if exists "Guest inquiries readable by provider and admin" on public.guest_inquiries;
create policy "Guest inquiries readable by provider and admin"
  on public.guest_inquiries
  for select
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

alter table public.provider_photos enable row level security;

drop policy if exists "Provider photos selectable by owner" on public.provider_photos;
create policy "Provider photos selectable by owner"
  on public.provider_photos
  for select
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

drop policy if exists "Provider photos insertable by owner" on public.provider_photos;
create policy "Provider photos insertable by owner"
  on public.provider_photos
  for insert
  with check (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

drop policy if exists "Provider photos updatable by owner" on public.provider_photos;
create policy "Provider photos updatable by owner"
  on public.provider_photos
  for update
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  )
  with check (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

drop policy if exists "Provider photos deletable by owner" on public.provider_photos;
create policy "Provider photos deletable by owner"
  on public.provider_photos
  for delete
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

drop policy if exists "Inquiry messages readable by participants and admin" on public.inquiry_messages;
create policy "Inquiry messages readable by participants and admin"
  on public.inquiry_messages
  for select
  using (
    exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (
          i.parent_profile_id = auth.uid()
          or public.is_provider_owner_of(i.provider_profile_id)
          or public.is_current_user_admin()
        )
    )
  );

drop policy if exists "Inquiry messages insertable by participants" on public.inquiry_messages;
create policy "Inquiry messages insertable by participants"
  on public.inquiry_messages
  for insert
  with check (
    sender_profile_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      where i.id = inquiry_messages.inquiry_id
        and (
          i.parent_profile_id = auth.uid()
          or public.is_provider_owner_of(i.provider_profile_id)
        )
    )
  );

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
  v_is_provider_owner boolean;
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

  v_is_provider_owner := public.is_provider_owner_of(v_provider_id);

  if v_sender_id <> v_parent_id and not v_is_provider_owner then
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

  if v_parent_id is null or (
    v_uid <> v_parent_id
    and not public.is_provider_owner_of(v_provider_id)
    and not public.is_current_user_admin()
  ) then
    return;
  end if;

  return query
  select
    1::int as message_order,
    'parent'::text as sender_type,
    i.parent_profile_id as sender_profile_id,
    public.decrypt_sensitive_text(i.inquiry_message_encrypted) as body_decrypted,
    i.created_at as created_at
  from public.inquiries i
  where i.id = p_inquiry_id;

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
  where exists (
      select 1
      from public.provider_profiles provider
      where provider.profile_id = i.provider_profile_id
        and (provider.profile_id = v_uid or provider.owner_profile_id = v_uid)
    )
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

  if v_uid <> v_parent_id
    and not public.is_provider_owner_of(v_provider_id)
    and not public.is_current_user_admin() then
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

create or replace function public.get_guest_inquiry_message_decrypted(p_guest_inquiry_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id uuid;
  v_encrypted bytea;
begin
  select gi.provider_profile_id, gi.message_encrypted
  into v_provider_id, v_encrypted
  from public.guest_inquiries gi
  where gi.id = p_guest_inquiry_id;

  if v_provider_id is null then
    return null;
  end if;

  if not public.is_provider_owner_of(v_provider_id) and not public.is_current_user_admin() then
    return null;
  end if;

  return public.decrypt_sensitive_text(v_encrypted);
end;
$$;
