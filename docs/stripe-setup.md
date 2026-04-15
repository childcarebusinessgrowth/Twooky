# Stripe Setup Guide

## What You Need To Do Now

The Stripe integration code is already in the app. To make it work end to end, finish the external setup below.

## 1. Create the Stripe products and prices

In Stripe Dashboard, create these recurring prices:

- `Grow` monthly
- `Grow` yearly
- `Thrive` monthly
- `Thrive` yearly

Recommended setup:

- `Grow` monthly: `$29/month`
- `Grow` yearly: `$319/year`
- `Thrive` monthly: `$59/month`
- `Thrive` yearly: `$649/year`

These yearly amounts match the existing app pricing rule of 1 month free.

After creating them, copy the four Stripe `price_...` IDs.

## 2. Fill in the Stripe environment variables

Add these values in your local `.env.local` and in your deployment environment:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BILLING_PORTAL_RETURN_URL=
STRIPE_PRICE_GROW_MONTHLY=
STRIPE_PRICE_GROW_YEARLY=
STRIPE_PRICE_THRIVE_MONTHLY=
STRIPE_PRICE_THRIVE_YEARLY=
```

Notes:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: from Stripe Developers → API keys
- `STRIPE_SECRET_KEY`: from Stripe Developers → API keys
- `STRIPE_WEBHOOK_SECRET`: from the webhook endpoint you create in step 4
- `STRIPE_BILLING_PORTAL_RETURN_URL`: optional, but recommended
- If `STRIPE_BILLING_PORTAL_RETURN_URL` is not set, the app falls back to:
  - `${NEXT_PUBLIC_SITE_URL}/dashboard/provider/subscription`

## 3. Apply the database migration

Run the new Supabase migration so the billing table exists:

- Migration file: `supabase/migrations/20260415120000_provider_billing_subscriptions.sql`

This creates `provider_billing_subscriptions`, which stores:

- Stripe customer ID
- Stripe subscription ID
- Stripe price ID
- current billing interval
- Stripe subscription status
- cancel-at-period-end
- current period dates

It also keeps `provider_profiles.plan_id` synced as the app-facing entitlement.

## 4. Create the Stripe webhook

Create a Stripe webhook endpoint pointing to:

- Local: `http://localhost:3000/api/billing/webhook`
- Production: `https://your-domain.com/api/billing/webhook`

Subscribe the webhook to these events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Then copy the webhook signing secret into:

- `STRIPE_WEBHOOK_SECRET`

Important:

- The app updates subscription state from webhooks, not from the success redirect page.
- If the webhook is not configured correctly, providers may pay in Stripe but their plan will not update in the app.

## 5. Enable the Stripe billing portal

In Stripe Dashboard:

1. Open Billing → Customer portal
2. Enable the portal
3. Allow subscription cancellation
4. Allow plan switching if you want providers to change between `Grow` and `Thrive`
5. Set the return URL to your provider subscription page

Recommended return URL:

- `https://your-domain.com/dashboard/provider/subscription`

The app uses this route for the "Manage Billing" button.

## 6. Test locally

Start the app and verify:

1. A provider account can open the pricing page.
2. `Grow` monthly starts Stripe Checkout.
3. `Grow` yearly starts Stripe Checkout.
4. `Thrive` monthly starts Stripe Checkout.
5. `Thrive` yearly starts Stripe Checkout.
6. After successful payment, Stripe sends the webhook.
7. `provider_billing_subscriptions` is updated.
8. `provider_profiles.plan_id` changes from `sprout` to `grow` or `thrive`.
9. The provider dashboard subscription page shows the live plan, status, and renewal date.
10. "Manage Billing" opens Stripe Customer Portal.

## 7. Test cancellation behavior

From Stripe Customer Portal:

1. Cancel a paid subscription
2. Confirm the webhook fires
3. Confirm `cancel_at_period_end` becomes `true`
4. Confirm the provider still keeps paid access until `current_period_end`
5. Confirm the plan falls back to `sprout` when the subscription is fully canceled

## 8. Test with Stripe CLI locally

If you want the easiest local webhook testing flow:

1. Install Stripe CLI
2. Login:

```bash
stripe login
```

3. Forward Stripe events to your local app:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

4. Copy the displayed webhook secret into `STRIPE_WEBHOOK_SECRET`

This lets local Stripe checkout and webhook syncing work together.

## 9. Deploy and configure production

Before production testing:

1. Add all Stripe env vars to Vercel
2. Make sure the production webhook points to `/api/billing/webhook`
3. Recreate or use live-mode Stripe products and prices
4. Confirm the live webhook secret is stored in production env vars
5. Apply the billing migration in production Supabase

Important:

- Test-mode Stripe keys and live-mode Stripe keys are different
- Test-mode price IDs and live-mode price IDs are also different

## 10. Files involved in this integration

Core files:

- `app/api/billing/checkout/route.ts`
- `app/api/billing/portal/route.ts`
- `app/api/billing/webhook/route.ts`
- `app/dashboard/provider/subscription/page.tsx`
- `components/pricing/pricing-page-client.tsx`
- `lib/provider-billing.ts`
- `lib/stripe.ts`
- `supabase/migrations/20260415120000_provider_billing_subscriptions.sql`

## Quick checklist

- Create 4 Stripe prices
- Add all Stripe env vars
- Apply Supabase migration
- Configure Stripe webhook
- Enable Stripe customer portal
- Test checkout
- Test webhook sync
- Test cancellation
- Configure production Stripe env vars
