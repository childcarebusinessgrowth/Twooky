-- Allow guest inquiry source "microsite" (provider website contact form)

alter table if exists public.guest_inquiries
  drop constraint if exists guest_inquiries_source_allowed;

alter table if exists public.guest_inquiries
  add constraint guest_inquiries_source_allowed
  check (source is null or source in ('directory', 'compare', 'microsite'));

drop function if exists public.create_guest_inquiry(text, date, date, text, text, text, text, text, boolean, text, text);

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
  if v_source is not null and v_source not in ('directory', 'compare', 'microsite') then
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
