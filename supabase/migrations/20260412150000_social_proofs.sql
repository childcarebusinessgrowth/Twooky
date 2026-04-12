create table if not exists public.social_proofs (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  type text not null,
  content text not null,
  rating smallint,
  image_url text,
  video_url text,
  author_name text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint social_proofs_type_allowed check (type in ('text', 'image', 'video')),
  constraint social_proofs_rating_range check (rating is null or (rating >= 1 and rating <= 5)),
  constraint social_proofs_display_order_non_negative check (display_order >= 0),
  constraint social_proofs_image_required_for_image_type check (type <> 'image' or image_url is not null),
  constraint social_proofs_video_required_for_video_type check (type <> 'video' or video_url is not null)
);

create index if not exists social_proofs_provider_idx
  on public.social_proofs (provider_profile_id);

create index if not exists social_proofs_provider_active_order_idx
  on public.social_proofs (provider_profile_id, is_active, display_order, created_at desc);

create or replace function public.handle_social_proofs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists social_proofs_set_updated_at on public.social_proofs;
create trigger social_proofs_set_updated_at
before update on public.social_proofs
for each row execute function public.handle_social_proofs_updated_at();

alter table public.social_proofs enable row level security;

drop policy if exists "Active social proofs are viewable by everyone" on public.social_proofs;
create policy "Active social proofs are viewable by everyone"
  on public.social_proofs
  for select
  using (is_active = true);

drop policy if exists "Social proofs are manageable by admins" on public.social_proofs;
create policy "Social proofs are manageable by admins"
  on public.social_proofs
  for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());
