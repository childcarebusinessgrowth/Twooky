-- Program types rich content: about, key benefits, FAQs.

alter table public.program_types
  add column if not exists about_text text,
  add column if not exists key_benefits text[] default '{}',
  add column if not exists slug text unique;

create index if not exists program_types_slug_idx on public.program_types (slug) where slug is not null;

-- Backfill slug from name for existing rows
update public.program_types
set slug = lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
where slug is null and trim(name) <> '';

create table if not exists public.program_type_faqs (
  id uuid primary key default gen_random_uuid(),
  program_type_id uuid not null references public.program_types(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists program_type_faqs_program_type_idx
  on public.program_type_faqs (program_type_id);

create index if not exists program_type_faqs_sort_idx
  on public.program_type_faqs (program_type_id, sort_order);

alter table public.program_type_faqs enable row level security;

drop policy if exists "Program type FAQs are viewable by everyone" on public.program_type_faqs;
create policy "Program type FAQs are viewable by everyone"
  on public.program_type_faqs
  for select
  using (true);

drop policy if exists "Program type FAQs writable by admin only" on public.program_type_faqs;
create policy "Program type FAQs writable by admin only"
  on public.program_type_faqs
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());
