-- Link program types to age groups from the database.

alter table public.program_types
  add column if not exists age_group_ids uuid[] default '{}';

-- Seed age_group_ids: link each program type to relevant age groups.
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) = 'infant') where lower(name) = 'infant care';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) = 'toddler') where lower(name) = 'toddler care';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) in ('preschool', 'pre-k')) where lower(name) = 'preschool';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) in ('preschool', 'pre-k')) where lower(name) = 'montessori';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) = 'toddler') where lower(name) = 'home daycare';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups where lower(name) = 'school age') where lower(name) = 'after school';
update public.program_types set age_group_ids = (select array_agg(id order by sort_order) from public.age_groups) where lower(name) = 'special needs';
