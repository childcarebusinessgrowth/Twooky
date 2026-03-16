-- Add short description for each program type.

alter table public.program_types
  add column if not exists short_description text;
