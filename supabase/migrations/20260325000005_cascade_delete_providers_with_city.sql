-- Ensure deleting a city deletes providers in that city.
-- Changes provider_profiles.city_id FK from ON DELETE RESTRICT -> ON DELETE CASCADE.

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
    and rel.relname = 'provider_profiles'
    and con.conname like '%city_id%';

  if fk_name is not null then
    execute format('alter table public.provider_profiles drop constraint %I', fk_name);
  end if;
end
$$;

alter table public.provider_profiles
  add constraint provider_profiles_city_id_fkey
  foreign key (city_id)
  references public.cities(id)
  on delete cascade;

commit;

