-- Persist the Stripe-backed subscription state for each provider profile.

create table if not exists public.provider_billing_subscriptions (
  provider_profile_id uuid primary key references public.provider_profiles(profile_id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_product_id text,
  stripe_price_id text,
  plan_id text not null default 'sprout',
  billing_interval text,
  status text not null default 'incomplete',
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_billing_subscriptions_plan_id_check'
      and conrelid = 'public.provider_billing_subscriptions'::regclass
  ) then
    alter table public.provider_billing_subscriptions
      add constraint provider_billing_subscriptions_plan_id_check
      check (plan_id in ('sprout', 'grow', 'thrive'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_billing_subscriptions_billing_interval_check'
      and conrelid = 'public.provider_billing_subscriptions'::regclass
  ) then
    alter table public.provider_billing_subscriptions
      add constraint provider_billing_subscriptions_billing_interval_check
      check (
        billing_interval is null
        or billing_interval in ('month', 'year')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_billing_subscriptions_status_check'
      and conrelid = 'public.provider_billing_subscriptions'::regclass
  ) then
    alter table public.provider_billing_subscriptions
      add constraint provider_billing_subscriptions_status_check
      check (
        status in (
          'incomplete',
          'incomplete_expired',
          'trialing',
          'active',
          'past_due',
          'canceled',
          'unpaid',
          'paused'
        )
      );
  end if;
end
$$;

create index if not exists provider_billing_subscriptions_plan_id_idx
  on public.provider_billing_subscriptions (plan_id);

create index if not exists provider_billing_subscriptions_status_idx
  on public.provider_billing_subscriptions (status);

create index if not exists provider_billing_subscriptions_current_period_end_idx
  on public.provider_billing_subscriptions (current_period_end);

drop trigger if exists provider_billing_subscriptions_set_updated_at
  on public.provider_billing_subscriptions;
create trigger provider_billing_subscriptions_set_updated_at
before update on public.provider_billing_subscriptions
for each row execute function public.handle_profiles_updated_at();

alter table public.provider_billing_subscriptions enable row level security;

drop policy if exists "Provider billing subscriptions selectable by owner or admin"
  on public.provider_billing_subscriptions;
create policy "Provider billing subscriptions selectable by owner or admin"
  on public.provider_billing_subscriptions
  for select
  using (
    public.is_provider_owner_of(provider_profile_id)
    or public.is_current_user_admin()
  );

comment on table public.provider_billing_subscriptions is
  'Stripe-backed billing state for provider subscriptions.';

comment on column public.provider_billing_subscriptions.plan_id is
  'Current app-facing entitlement synced from Stripe. sprout means no active paid subscription.';
