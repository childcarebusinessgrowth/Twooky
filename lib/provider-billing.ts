import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  PLAN_IDS,
  getPricingPlan,
  isPaidPlanId,
  type BillingPeriod,
  type PaidPlanId,
  type PlanId,
} from "@/lib/pricing-data"
import { getStripeServerClient } from "@/lib/stripe"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>
export type ProviderBillingRow = Database["public"]["Tables"]["provider_billing_subscriptions"]["Row"]
export type ProviderBillingStatus = ProviderBillingRow["status"]
export type ProviderBillingInterval = NonNullable<ProviderBillingRow["billing_interval"]>

const PAID_ENTITLEMENT_STATUSES = new Set<ProviderBillingStatus>([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
])

function isPlanId(value: string | null | undefined): value is PlanId {
  return value != null && PLAN_IDS.includes(value as PlanId)
}

export function isBillingPeriod(value: string | null | undefined): value is BillingPeriod {
  return value === "monthly" || value === "yearly"
}

export function billingPeriodToStripeInterval(period: BillingPeriod): ProviderBillingInterval {
  return period === "monthly" ? "month" : "year"
}

export function stripeIntervalToBillingPeriod(
  interval: string | null | undefined,
): BillingPeriod | null {
  if (interval === "month") return "monthly"
  if (interval === "year") return "yearly"
  return null
}

function readStripePriceEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required Stripe price environment variable: ${name}`)
  }
  return value
}

export function getStripePriceId(planId: PaidPlanId, billingPeriod: BillingPeriod): string {
  if (planId === "grow" && billingPeriod === "monthly") {
    return readStripePriceEnv("STRIPE_PRICE_GROW_MONTHLY")
  }
  if (planId === "grow" && billingPeriod === "yearly") {
    return readStripePriceEnv("STRIPE_PRICE_GROW_YEARLY")
  }
  if (planId === "thrive" && billingPeriod === "monthly") {
    return readStripePriceEnv("STRIPE_PRICE_THRIVE_MONTHLY")
  }
  return readStripePriceEnv("STRIPE_PRICE_THRIVE_YEARLY")
}

export function getPlanFromStripePriceId(
  priceId: string | null | undefined,
): { planId: PaidPlanId; billingInterval: ProviderBillingInterval } | null {
  if (!priceId) return null

  const candidates: Array<{
    planId: PaidPlanId
    billingPeriod: BillingPeriod
    billingInterval: ProviderBillingInterval
  }> = [
    { planId: "grow", billingPeriod: "monthly", billingInterval: "month" },
    { planId: "grow", billingPeriod: "yearly", billingInterval: "year" },
    { planId: "thrive", billingPeriod: "monthly", billingInterval: "month" },
    { planId: "thrive", billingPeriod: "yearly", billingInterval: "year" },
  ]

  for (const candidate of candidates) {
    if (getStripePriceId(candidate.planId, candidate.billingPeriod) === priceId) {
      return {
        planId: candidate.planId,
        billingInterval: candidate.billingInterval,
      }
    }
  }

  return null
}

export function hasPaidSubscriptionEntitlement(
  subscription: Pick<ProviderBillingRow, "stripe_subscription_id" | "status"> | null | undefined,
): boolean {
  if (!subscription?.stripe_subscription_id) return false
  return PAID_ENTITLEMENT_STATUSES.has(subscription.status)
}

export function formatProviderBillingInterval(
  interval: ProviderBillingRow["billing_interval"],
): string | null {
  if (interval === "month") return "Monthly"
  if (interval === "year") return "Yearly"
  return null
}

export function formatProviderBillingStatus(
  status: ProviderBillingStatus,
  cancelAtPeriodEnd = false,
): string {
  if (cancelAtPeriodEnd && (status === "active" || status === "trialing")) {
    return "Canceling at period end"
  }

  switch (status) {
    case "active":
      return "Active"
    case "trialing":
      return "Trialing"
    case "past_due":
      return "Past due"
    case "unpaid":
      return "Unpaid"
    case "paused":
      return "Paused"
    case "incomplete":
      return "Incomplete"
    case "incomplete_expired":
      return "Incomplete expired"
    case "canceled":
      return "Canceled"
    default:
      return status
  }
}

export async function getProviderBillingSnapshot(
  supabase: TypedClient,
  providerProfileId: string,
): Promise<{
  providerPlanId: PlanId
  providerPlanName: string
  billing: ProviderBillingRow | null
}> {
  const [{ data: providerProfile }, { data: billing }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("plan_id")
      .eq("profile_id", providerProfileId)
      .maybeSingle(),
    supabase
      .from("provider_billing_subscriptions")
      .select("*")
      .eq("provider_profile_id", providerProfileId)
      .maybeSingle(),
  ])

  const providerPlanId = isPlanId(providerProfile?.plan_id) ? providerProfile.plan_id : "sprout"
  const providerPlanName = getPricingPlan(providerPlanId)?.name ?? "Sprout"

  return {
    providerPlanId,
    providerPlanName,
    billing: billing ?? null,
  }
}

async function findStoredBillingRow(
  providerProfileId: string,
): Promise<Pick<ProviderBillingRow, "stripe_customer_id" | "stripe_subscription_id"> | null> {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from("provider_billing_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("provider_profile_id", providerProfileId)
    .maybeSingle()

  return data ?? null
}

export async function getOrCreateStripeCustomerForProvider(input: {
  providerProfileId: string
  providerName?: string | null
  email: string
}): Promise<string> {
  const stored = await findStoredBillingRow(input.providerProfileId)
  if (stored?.stripe_customer_id) return stored.stripe_customer_id

  const stripe = getStripeServerClient()
  const existingCustomers = await stripe.customers.list({
    email: input.email,
    limit: 20,
  })

  const matched = existingCustomers.data.find(
    (customer) => customer.metadata?.provider_profile_id === input.providerProfileId,
  )
  if (matched?.id) {
    return matched.id
  }

  const customer = await stripe.customers.create({
    email: input.email,
    name: input.providerName ?? undefined,
    metadata: {
      provider_profile_id: input.providerProfileId,
    },
  })

  return customer.id
}

function unixToIso(value: number | null | undefined): string | null {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

function resolvePaidPlanForSubscription(
  subscription: Stripe.Subscription,
): { planId: PaidPlanId; billingInterval: ProviderBillingInterval } | null {
  const price = subscription.items.data[0]?.price
  const mappedFromPrice = getPlanFromStripePriceId(price?.id)
  if (mappedFromPrice) return mappedFromPrice

  const metadataPlan = subscription.metadata.plan_id
  const metadataInterval = subscription.metadata.billing_interval
  if (
    isPaidPlanId(metadataPlan) &&
    (metadataInterval === "month" || metadataInterval === "year")
  ) {
    return {
      planId: metadataPlan,
      billingInterval: metadataInterval,
    }
  }

  return null
}

async function resolveProviderProfileIdForSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metadataProviderProfileId = subscription.metadata.provider_profile_id?.trim()
  if (metadataProviderProfileId) return metadataProviderProfileId

  const admin = getSupabaseAdminClient()

  const bySubscription = await admin
    .from("provider_billing_subscriptions")
    .select("provider_profile_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle()

  if (bySubscription.data?.provider_profile_id) {
    return bySubscription.data.provider_profile_id
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
  if (!customerId) return null

  const byCustomer = await admin
    .from("provider_billing_subscriptions")
    .select("provider_profile_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle()

  return byCustomer.data?.provider_profile_id ?? null
}

export async function syncProviderSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const providerProfileId = await resolveProviderProfileIdForSubscription(subscription)
  if (!providerProfileId) {
    throw new Error(`Unable to resolve provider profile for Stripe subscription ${subscription.id}.`)
  }

  const planMapping = resolvePaidPlanForSubscription(subscription)
  const shouldGrantPaidPlan =
    planMapping != null && PAID_ENTITLEMENT_STATUSES.has(subscription.status as ProviderBillingStatus)

  const effectivePlanId: ProviderBillingRow["plan_id"] =
    shouldGrantPaidPlan && planMapping ? planMapping.planId : "sprout"
  const effectiveInterval = planMapping?.billingInterval ?? null
  const primaryItem = subscription.items.data[0]
  const primaryPrice = primaryItem?.price
  const productId =
    typeof primaryPrice?.product === "string" ? primaryPrice.product : primaryPrice?.product?.id ?? null
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null

  const admin = getSupabaseAdminClient()
  const billingUpdate: Database["public"]["Tables"]["provider_billing_subscriptions"]["Insert"] = {
    provider_profile_id: providerProfileId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_product_id: productId,
    stripe_price_id: primaryPrice?.id ?? null,
    plan_id: effectivePlanId,
    billing_interval: effectiveInterval,
    status: subscription.status as ProviderBillingStatus,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: unixToIso(primaryItem?.current_period_start),
    current_period_end: unixToIso(primaryItem?.current_period_end),
    canceled_at: unixToIso(subscription.canceled_at),
  }

  const { error: billingError } = await admin
    .from("provider_billing_subscriptions")
    .upsert(billingUpdate, { onConflict: "provider_profile_id" })

  if (billingError) {
    throw new Error(billingError.message)
  }

  const { error: profileError } = await admin
    .from("provider_profiles")
    .update({ plan_id: effectivePlanId })
    .eq("profile_id", providerProfileId)

  if (profileError) {
    throw new Error(profileError.message)
  }
}
