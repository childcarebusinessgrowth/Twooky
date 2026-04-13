-- Security Advisor: avoid extensions in exposed `public` schema.
-- Keep this idempotent for local/preview/prod environments.
create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_extension
    where extname = 'pg_trgm'
  ) then
    alter extension pg_trgm set schema extensions;
  else
    create extension if not exists pg_trgm with schema extensions;
  end if;
end;
$$;
