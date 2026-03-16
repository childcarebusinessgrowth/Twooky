-- Ensure encryption helpers can resolve pgcrypto functions from the extensions schema.
-- Some RPCs run with search_path = public, so helper functions must include extensions.

create extension if not exists pgcrypto with schema extensions;

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
