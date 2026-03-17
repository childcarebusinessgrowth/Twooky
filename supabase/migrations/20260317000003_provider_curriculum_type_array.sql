-- Change curriculum_type from text to text[] to allow multiple curriculum types (like age_groups_served)
-- Migrate existing single values into arrays

alter table public.provider_profiles
  add column if not exists curriculum_type_new text[];

update public.provider_profiles
set curriculum_type_new = case
  when curriculum_type is null or trim(coalesce(curriculum_type, '')) = '' then null
  else array[trim(curriculum_type)]
end;

alter table public.provider_profiles drop column if exists curriculum_type;
alter table public.provider_profiles rename column curriculum_type_new to curriculum_type;
