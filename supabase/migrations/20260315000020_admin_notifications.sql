-- Admin notifications + per-admin read tracking.
-- Event rows are stored once in admin_notifications.
-- Each admin's read state is stored separately in admin_notification_reads.

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text,
  href text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create table if not exists public.admin_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists admin_notification_reads_unique_idx
  on public.admin_notification_reads (admin_user_id, notification_id);

create index if not exists admin_notification_reads_admin_user_id_idx
  on public.admin_notification_reads (admin_user_id, read_at desc);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

drop policy if exists "Admins can read admin notifications" on public.admin_notifications;
create policy "Admins can read admin notifications"
  on public.admin_notifications
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can read own notification reads" on public.admin_notification_reads;
create policy "Admins can read own notification reads"
  on public.admin_notification_reads
  for select
  using (
    admin_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can insert own notification reads" on public.admin_notification_reads;
create policy "Admins can insert own notification reads"
  on public.admin_notification_reads
  for insert
  with check (
    admin_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update own notification reads" on public.admin_notification_reads;
create policy "Admins can update own notification reads"
  on public.admin_notification_reads
  for update
  using (
    admin_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    admin_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Event capture trigger functions.
-- SECURITY DEFINER is required so writes to admin_notifications are not blocked
-- by the permissions/RLS of the user creating the source row.

create or replace function public.notify_admin_on_provider_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'provider' then
    insert into public.admin_notifications (type, title, message, href)
    values (
      'provider_signup',
      'New provider signup',
      coalesce(new.display_name, new.email, 'New provider') || ' created a provider account.',
      '/admin/parents'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_provider_signup on public.profiles;
create trigger trg_admin_notify_provider_signup
after insert on public.profiles
for each row
execute function public.notify_admin_on_provider_signup();

create or replace function public.notify_admin_on_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, message, href)
  values (
    'contact_message',
    'New contact message',
    coalesce(new.name, new.email, 'Unknown sender') || ' sent a contact request.',
    '/admin/contact-messages'
  );
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_contact_message on public.contact_messages;
create trigger trg_admin_notify_contact_message
after insert on public.contact_messages
for each row
execute function public.notify_admin_on_contact_message();

create or replace function public.notify_admin_on_review_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, message, href)
  values (
    'review_report',
    'Review reported for moderation',
    'A provider submitted a new review report.',
    '/admin'
  );
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_review_report on public.review_reports;
create trigger trg_admin_notify_review_report
after insert on public.review_reports
for each row
execute function public.notify_admin_on_review_report();

create or replace function public.notify_admin_on_listing_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.listing_status = 'pending'
     and (tg_op = 'INSERT' or old.listing_status is distinct from new.listing_status) then
    insert into public.admin_notifications (type, title, message, href)
    values (
      'listing_pending',
      'Listing submitted for review',
      coalesce(new.business_name, 'A provider') || ' submitted their listing for approval.',
      '/admin/listings'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_listing_pending on public.provider_profiles;
create trigger trg_admin_notify_listing_pending
after insert or update of listing_status on public.provider_profiles
for each row
execute function public.notify_admin_on_listing_pending();
