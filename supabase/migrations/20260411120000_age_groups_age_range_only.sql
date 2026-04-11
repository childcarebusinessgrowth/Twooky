-- Move age groups to age_range-only labels while preserving legacy tag ids.

alter table public.age_groups
  add column if not exists tag text;

update public.age_groups
set age_range = coalesce(nullif(trim(age_range), ''), nullif(trim(name), ''))
where age_range is null or trim(age_range) = '';

update public.age_groups
set tag = case
  when lower(trim(coalesce(name, ''))) = 'infant' then 'infant'
  when lower(trim(coalesce(name, ''))) = 'toddler' then 'toddler'
  when lower(trim(coalesce(name, ''))) = 'preschool' then 'preschool'
  when lower(trim(coalesce(name, ''))) in ('pre-k', 'prek') then 'prek'
  when lower(trim(coalesce(name, ''))) in ('school age', 'schoolage') then 'school_age'
  else nullif(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(name, age_range, ''))), '[^a-z0-9]+', '_', 'g'),
      '^_+|_+$',
      '',
      'g'
    ),
    ''
  )
end
where tag is null or trim(tag) = '';

update public.age_groups
set tag = nullif(
  regexp_replace(
    regexp_replace(lower(trim(coalesce(age_range, ''))), '[^a-z0-9]+', '_', 'g'),
    '^_+|_+$',
    '',
    'g'
  ),
  ''
)
where tag is null or trim(tag) = '';

update public.age_groups
set tag = 'age_group_' || replace(id::text, '-', '_')
where tag is null or trim(tag) = '';

with ranked as (
  select id, tag, row_number() over (partition by tag order by created_at, id) as rn
  from public.age_groups
),
renamed as (
  select id, case when rn = 1 then tag else tag || '_' || rn::text end as next_tag
  from ranked
)
update public.age_groups ag
set tag = renamed.next_tag
from renamed
where ag.id = renamed.id
  and ag.tag is distinct from renamed.next_tag;

alter table public.age_groups
  alter column age_range set not null,
  alter column tag set not null;

drop index if exists public.age_groups_active_idx;
create index if not exists age_groups_active_idx on public.age_groups (is_active, sort_order, age_range);

create unique index if not exists age_groups_tag_key on public.age_groups (tag);

alter table public.age_groups
  drop constraint if exists age_groups_name_key;

alter table public.age_groups
  drop column if exists name;
