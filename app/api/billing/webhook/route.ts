import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { syncProviderSubscriptionFromStripe } from "@/lib/provider-billing"
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

async function syncSubscriptionById(subscriptionId: string) {
  const stripe = getStripeServerClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  })
  await syncProviderSubscriptionFromStripe(subscription)
}

async function shouldProcessStripeEvent(event: Stripe.Event): Promise<boolean> {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .upsert(
      {
        event_id: event.id,
        event_type: event.type,
        created: event.created,
        livemode: event.livemode,
      },
      {
        onConflict: "event_id",
        ignoreDuplicates: true,
      },
    )
    .select("event_id")

  if (error) {
    throw new Error(error.message)
  }

  // When a duplicate is ignored, PostgREST returns an empty array.
  return Array.isArray(data) && data.length > 0
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 })
  }

  try {
    const payload = await request.text()
    const stripe = getStripeServerClient()
    const event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret())

    const shouldProcess = await shouldProcessStripeEvent(event)
    if (!shouldProcess) {
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          await syncSubscriptionById(session.subscription)
        }
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await syncSubscriptionById(subscription.id)
        break
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        type InvoiceWithSubscription = Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null
        }
        const invoice = event.data.object as InvoiceWithSubscription
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id ?? null
        if (subscriptionId) {
          await syncSubscriptionById(subscriptionId)
        }
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe webhook handling failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
