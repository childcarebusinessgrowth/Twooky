import "server-only"

import Stripe from "stripe"
import { getSiteUrl } from "@/lib/sitemap"

let stripeClient: Stripe | null = null

function readEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getStripeServerClient(): Stripe {
  if (stripeClient) return stripeClient

  stripeClient = new Stripe(readEnv("STRIPE_SECRET_KEY"))
  return stripeClient
}

export function getStripeWebhookSecret(): string {
  return readEnv("STRIPE_WEBHOOK_SECRET")
}

export function getStripePublishableKey(): string {
  return readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
}

export function getStripeBillingPortalReturnUrl(): string {
  const explicit = process.env.STRIPE_BILLING_PORTAL_RETURN_URL?.trim()
  if (explicit) return explicit
  return `${getSiteUrl()}/dashboard/provider/subscription`
}
