-- Contact form submissions (site contact page, not provider-specific inquiries)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  consent_to_contact boolean not null,
  consent_version text not null,
  consented_at timestamptz not null default timezone('utc'::text, now()),
  handled_status text not null default 'new',
  admin_note text,
  retention_until timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint contact_messages_handled_status_check check (handled_status in ('new', 'in_progress', 'resolved'))
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_handled_status_idx on public.contact_messages (handled_status);

alter table public.contact_messages enable row level security;

-- Only admins can read contact messages; inserts are done via API with service role
drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  using (public.is_current_user_admin());
