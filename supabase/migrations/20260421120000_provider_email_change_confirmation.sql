create table if not exists public.pending_email_changes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  current_email text not null,
  requested_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint pending_email_changes_emails_different check (lower(current_email) <> lower(requested_email))
);

create index if not exists pending_email_changes_profile_idx
  on public.pending_email_changes (profile_id);

create index if not exists pending_email_changes_expires_at_idx
  on public.pending_email_changes (expires_at);

alter table public.pending_email_changes enable row level security;
