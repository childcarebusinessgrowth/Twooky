-- Allow 'contacted' as a handled_status for contact_messages
alter table public.contact_messages
  drop constraint if exists contact_messages_handled_status_check;

alter table public.contact_messages
  add constraint contact_messages_handled_status_check
  check (handled_status in ('new', 'in_progress', 'contacted', 'resolved'));
