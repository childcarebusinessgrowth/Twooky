-- One-off: merge duplicate cities (same country + same normalized name).
-- Run this in Supabase SQL Editor.
--
-- For each duplicate group we keep the first city (by id), point all
-- provider_profiles at it, then delete the other duplicate row(s).

do $$
declare
  dup record;
  keeper_id uuid;
  i int;
begin
  for dup in
    select
      country_id,
      lower(trim(name)) as name_key,
      array_agg(id order by length(name) desc, id) as ids
    from public.cities
    where is_active = true
    group by country_id, lower(trim(name))
    having count(*) > 1
  loop
    keeper_id := dup.ids[1];

    for i in 2..array_length(dup.ids, 1) loop
      update public.provider_profiles
      set city_id = keeper_id
      where city_id = dup.ids[i];

      delete from public.cities
      where id = dup.ids[i];
    end loop;
  end loop;
end $$;
