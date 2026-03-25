-- Ensure deleting a country deletes its cities as well.
-- Changes cities.country_id FK from ON DELETE RESTRICT -> ON DELETE CASCADE.

begin;

do $$
declare
  fk_name text;
begin
  select con.conname into fk_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where con.contype = 'f'
    and nsp.nspname = 'public'
    and rel.relname = 'cities'
    and con.conname like '%country_id%';

  if fk_name is not null then
    execute format('alter table public.cities drop constraint %I', fk_name);
  end if;
end
$$;

alter table public.cities
  add constraint cities_country_id_fkey
  foreign key (country_id)
  references public.countries(id)
  on delete cascade;

commit;

