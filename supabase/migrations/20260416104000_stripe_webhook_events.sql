-- Track processed Stripe webhook event IDs to guarantee idempotency.

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  created integer not null,
  livemode boolean not null default false,
  processed_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists stripe_webhook_events_created_idx
  on public.stripe_webhook_events (created desc);

alter table public.stripe_webhook_events enable row level security;

-- Only the service role (admin client) should write/read these rows.
revoke all on table public.stripe_webhook_events from public;

