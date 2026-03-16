-- Ensure inquiry-related tables publish realtime change events.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'inquiries'
    ) then
      alter publication supabase_realtime add table public.inquiries;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'inquiry_messages'
    ) then
      alter publication supabase_realtime add table public.inquiry_messages;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'guest_inquiries'
    ) then
      alter publication supabase_realtime add table public.guest_inquiries;
    end if;
  end if;
end;
$$;
