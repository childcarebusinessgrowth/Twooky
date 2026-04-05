-- Security Advisor:
-- 1) Set immutable search_path on trigger/helper functions (mitigate search_path hijacking).
-- 2) Remove RLS policies that use WITH CHECK (true) on listing claims; app inserts use
--    service role (getSupabaseAdminClient), which bypasses RLS — anon/authenticated must not
--    insert arbitrary rows via PostgREST.

-- ---------------------------------------------------------------------------
-- Functions: add SET search_path = public
-- ---------------------------------------------------------------------------

create or replace function public.handle_provider_listing_claims_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.id = auth.uid() then
    if new.id is distinct from old.id then
      raise exception 'Changing profile id is not allowed.';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Changing profile email is not allowed.';
    end if;

    if new.role is distinct from old.role then
      raise exception 'Changing profile role is not allowed.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_locations_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.handle_blogs_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.get_compliance_setting(setting_key text, fallback_value text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  setting_value text;
begin
  select value into setting_value
  from public.compliance_policies
  where key = setting_key;

  return coalesce(setting_value, fallback_value);
end;
$$;

create or replace function public.get_inquiry_retention_days()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  raw_value text;
begin
  raw_value := public.get_compliance_setting('inquiry_retention_days', '365');
  return greatest(1, raw_value::integer);
exception
  when others then
    return 365;
end;
$$;

create or replace function public.get_pii_encryption_key()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  key_value text;
begin
  select nullif(value, '')
  into key_value
  from public.compliance_policies
  where key = 'pii_encryption_key';

  if key_value is not null then
    return key_value;
  end if;

  key_value := nullif(current_setting('app.settings.pii_encryption_key', true), '');

  if key_value is null then
    raise exception 'Missing encryption key. Set app.settings.pii_encryption_key or compliance_policies.pii_encryption_key.';
  end if;

  return key_value;
end;
$$;

create or replace function public.handle_inquiries_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  retention_days integer;
  expected_consent_version text;
begin
  if new.consent_to_contact is distinct from true then
    raise exception 'Consent is required before creating an inquiry.';
  end if;

  expected_consent_version := public.get_compliance_setting('consent_version', 'v1');
  if coalesce(new.consent_version, '') = '' then
    new.consent_version := expected_consent_version;
  end if;

  if new.consented_at is null then
    new.consented_at := timezone('utc'::text, now());
  end if;

  if new.retention_until is null then
    retention_days := public.get_inquiry_retention_days();
    new.retention_until := timezone('utc'::text, now()) + make_interval(days => retention_days);
  end if;

  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.purge_expired_inquiries()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
begin
  update public.inquiries
  set deleted_at = timezone('utc'::text, now()),
      inquiry_message_encrypted = public.encrypt_sensitive_text('[REDACTED: RETENTION EXPIRED]'),
      inquiry_message_search_hash = null,
      updated_at = timezone('utc'::text, now())
  where retention_until < timezone('utc'::text, now())
    and deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create or replace function public.handle_parent_reviews_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language plpgsql
stable
set search_path = public
as $$
begin
  return auth.uid();
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.app_role;
  initial_display_name text;
begin
  if new.raw_user_meta_data ? 'role' and (new.raw_user_meta_data->>'role') in ('parent', 'provider') then
    new_role := (new.raw_user_meta_data->>'role')::public.app_role;
  else
    new_role := 'parent';
  end if;

  if new_role = 'provider' then
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'business_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'Provider'
    );
  elsif new_role = 'parent' then
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'Parent'
    );
  else
    initial_display_name := coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      new.email
    );
  end if;

  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    new_role,
    initial_display_name
  );

  return new;
end;
$$;

create or replace function public.handle_provider_websites_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.handle_provider_website_pages_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: drop permissive insert policies (rely on service_role for inserts)
-- ---------------------------------------------------------------------------

drop policy if exists "Provider listing claims insertable by anyone" on public.provider_listing_claims;
drop policy if exists "Provider listing claim documents insertable by service" on public.provider_listing_claim_documents;
