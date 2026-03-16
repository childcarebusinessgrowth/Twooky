-- Guest (non-logged-in) parent inquiries. Providers can view but not reply.
-- Insert via create_guest_inquiry RPC (no auth required for submit).

create table if not exists public.guest_inquiries (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  child_dob date,
  ideal_start_date date,
  message_encrypted bytea not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  telephone text not null,
  consent_to_contact boolean not null,
  consent_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint guest_inquiries_consent_required check (consent_to_contact = true)
);

create index if not exists guest_inquiries_provider_profile_idx on public.guest_inquiries (provider_profile_id);
create index if not exists guest_inquiries_created_at_idx on public.guest_inquiries (created_at desc);

alter table public.guest_inquiries enable row level security;

-- Only the provider (and admin) can read their guest inquiries
drop policy if exists "Guest inquiries readable by provider and admin" on public.guest_inquiries;
create policy "Guest inquiries readable by provider and admin"
  on public.guest_inquiries
  for select
  using (
    provider_profile_id = auth.uid()
    or public.is_current_user_admin()
  );

-- No insert/update/delete via RLS for authenticated users; insert via RPC only
-- (so anonymous submitters can use the RPC called from API with service role or anon)

-- RPC: create_guest_inquiry (no auth; called from API). Encrypts message, inserts row.
create or replace function public.create_guest_inquiry(
  p_provider_slug text,
  p_child_dob date,
  p_ideal_start_date date,
  p_message_plain text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_telephone text,
  p_consent_to_contact boolean default true
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
    consented_at
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
    timezone('utc'::text, now())
  )
  returning id into v_guest_id;

  return v_guest_id;
end;
$$;

-- RPC: get_guest_inquiry_message_decrypted (for provider viewing; auth.uid() must be provider)
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

  if auth.uid() <> v_provider_id and not public.is_current_user_admin() then
    return null;
  end if;

  return public.decrypt_sensitive_text(v_encrypted);
end;
$$;
