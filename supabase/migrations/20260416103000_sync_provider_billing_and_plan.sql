-- Atomically sync Stripe-backed billing snapshot + provider plan assignment.
-- This ensures app entitlements (`provider_profiles.plan_id`) stay consistent with
-- the billing state stored in `provider_billing_subscriptions`.

create or replace function public.sync_provider_billing_and_plan(
  p_provider_profile_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_product_id text,
  p_stripe_price_id text,
  p_plan_id text,
  p_billing_interval text,
  p_status text,
  p_cancel_at_period_end boolean,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_canceled_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.provider_billing_subscriptions (
    provider_profile_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_product_id,
    stripe_price_id,
    plan_id,
    billing_interval,
    status,
    cancel_at_period_end,
    current_period_start,
    current_period_end,
    canceled_at
  )
  values (
    p_provider_profile_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_product_id,
    p_stripe_price_id,
    p_plan_id,
    p_billing_interval,
    p_status,
    p_cancel_at_period_end,
    p_current_period_start,
    p_current_period_end,
    p_canceled_at
  )
  on conflict (provider_profile_id)
  do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_product_id = excluded.stripe_product_id,
    stripe_price_id = excluded.stripe_price_id,
    plan_id = excluded.plan_id,
    billing_interval = excluded.billing_interval,
    status = excluded.status,
    cancel_at_period_end = excluded.cancel_at_period_end,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    canceled_at = excluded.canceled_at;

  update public.provider_profiles
    set plan_id = p_plan_id
  where profile_id = p_provider_profile_id;
end;
$$;

revoke all on function public.sync_provider_billing_and_plan(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz,
  timestamptz
) from public;

