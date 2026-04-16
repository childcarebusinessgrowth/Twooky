# Stripe verification (recurring subscriptions)

This app updates billing + provider plan assignment from Stripe **webhooks** (not from the success redirect URL).

## 1) Local webhook forwarding

1. Start the app locally.
2. Login to Stripe CLI:

```bash
stripe login
```

3. Forward events to your app:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET` and restart your dev server.

## 2) Happy-path checkout

- In the UI, start a `Grow` or `Thrive` subscription.
- Confirm webhook deliveries in the Stripe CLI output.

Expected outcomes in DB:
- `public.provider_billing_subscriptions` is upserted for the provider
- `public.provider_profiles.plan_id` becomes `grow` or `thrive`

## 3) Replay safety (idempotency)

- Re-send the same Stripe event ID and confirm nothing breaks or regresses:

```bash
stripe events list --limit 5
stripe events resend <evt_id>
```

Expected outcome:
- The webhook returns 200
- No plan flip-flop and no duplicate side-effects

## 4) Renewal behavior (future payments)

To validate renewals reliably, use Stripe **Test Clocks** in test mode:

- Create a subscription attached to a test clock
- Advance the clock to trigger renewals

Confirm:
- You receive `invoice.paid` on successful renewal
- You receive `invoice.payment_failed` on failure
- You also receive `customer.subscription.updated`

Expected DB outcomes:
- `provider_billing_subscriptions.current_period_end` advances on renewal
- `provider_profiles.plan_id` stays paid when entitled
- `provider_profiles.plan_id` downgrades to `sprout` when the subscription becomes non-entitled

## 5) Cancellation at period end

From the Stripe customer portal:
- Cancel the subscription at period end

Expected:
- While `cancel_at_period_end=true` and status is still `active`, the provider remains on the paid plan
- Once Stripe transitions to a non-entitled terminal state, the provider downgrades to `sprout`
