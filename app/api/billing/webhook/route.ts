import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { syncProviderSubscriptionFromStripe } from "@/lib/provider-billing"
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe"

async function syncSubscriptionById(subscriptionId: string) {
  const stripe = getStripeServerClient()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  })
  await syncProviderSubscriptionFromStripe(subscription)
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
        await syncProviderSubscriptionFromStripe(subscription)
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
