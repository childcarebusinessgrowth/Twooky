-- Add outcome to inquiries so providers can mark converted/declined for analytics conversion rate.
alter table if exists public.inquiries
  add column if not exists outcome text not null default 'open';

alter table if exists public.inquiries
  drop constraint if exists inquiries_outcome_allowed;

alter table if exists public.inquiries
  add constraint inquiries_outcome_allowed
  check (outcome in ('open', 'converted', 'declined'));

comment on column public.inquiries.outcome is 'Provider-set outcome: open, converted (enrollment), or declined. Used for conversion rate analytics.';
