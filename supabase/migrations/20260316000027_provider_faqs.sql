-- Provider FAQs: provider-managed Q&A displayed on public profile.

create table if not exists public.provider_faqs (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(profile_id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists provider_faqs_provider_profile_idx
  on public.provider_faqs (provider_profile_id);

create index if not exists provider_faqs_sort_idx
  on public.provider_faqs (provider_profile_id, sort_order);

alter table public.provider_faqs enable row level security;

drop policy if exists "Provider FAQs are viewable by everyone" on public.provider_faqs;
create policy "Provider FAQs are viewable by everyone"
  on public.provider_faqs
  for select
  using (true);

drop policy if exists "Provider FAQs writable by owner" on public.provider_faqs;
create policy "Provider FAQs writable by owner"
  on public.provider_faqs
  for all
  using (provider_profile_id = auth.uid())
  with check (provider_profile_id = auth.uid());
