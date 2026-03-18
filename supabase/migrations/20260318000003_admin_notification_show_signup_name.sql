-- Update provider signup notification to show the signup name in the title.
create or replace function public.notify_admin_on_provider_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_name text;
begin
  if new.role = 'provider' then
    signup_name := coalesce(nullif(trim(new.display_name), ''), new.email, 'New provider');
    insert into public.admin_notifications (type, title, message, href)
    values (
      'provider_signup',
      'New provider signup: ' || signup_name,
      signup_name || ' created a provider account.',
      '/admin/parents'
    );
  end if;
  return new;
end;
$$;
