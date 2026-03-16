-- Ensure inquiry encryption works when app.settings.pii_encryption_key is not set.
-- We generate a one-time fallback key in compliance_policies and use it in helper functions.

insert into public.compliance_policies (key, value, description)
select
  'pii_encryption_key',
  coalesce(
    nullif(current_setting('app.settings.pii_encryption_key', true), ''),
    encode(gen_random_bytes(32), 'hex')
  ),
  'Fallback symmetric key for inquiry PII encryption when app.settings.pii_encryption_key is not set.'
where not exists (
  select 1
  from public.compliance_policies
  where key = 'pii_encryption_key'
);

create or replace function public.get_pii_encryption_key()
returns text
language plpgsql
stable
security definer
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

create or replace function public.encrypt_sensitive_text(plain_text text)
returns bytea
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  key_value text;
begin
  if plain_text is null then
    return null;
  end if;

  key_value := public.get_pii_encryption_key();

  return pgp_sym_encrypt(plain_text, key_value, 'cipher-algo=aes256');
end;
$$;

create or replace function public.decrypt_sensitive_text(cipher_value bytea)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  key_value text;
begin
  if cipher_value is null then
    return null;
  end if;

  key_value := public.get_pii_encryption_key();

  return pgp_sym_decrypt(cipher_value, key_value);
end;
$$;
