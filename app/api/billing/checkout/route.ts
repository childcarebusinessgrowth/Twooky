import { NextResponse } from "next/server"
import { z } from "zod"
import { resolveRoleForUser } from "@/lib/authz"
import { isPaidPlanId } from "@/lib/pricing-data"
import {
  billingPeriodToStripeInterval,
  getStripePriceId,
  getOrCreateStripeCustomerForProvider,
  getProviderBillingSnapshot,
  isBillingPeriod,
} from "@/lib/provider-billing"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"
import { getSiteUrl } from "@/lib/sitemap"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getStripeBillingPortalReturnUrl, getStripeServerClient } from "@/lib/stripe"

const requestSchema = z.object({
  planId: z.enum(["grow", "thrive"]),
  billingPeriod: z.enum(["monthly", "yearly"]),
})

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "billing-checkout",
    limit: 10,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const body = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid billing selection." }, { status: 400 })
    }

    const { planId, billingPeriod } = parsed.data
    if (!isPaidPlanId(planId) || !isBillingPeriod(billingPeriod)) {
      return NextResponse.json({ error: "Invalid billing selection." }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "provider") {
      return NextResponse.json({ error: "Provider account required." }, { status: 403 })
    }

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const { providerPlanId, billing } = await getProviderBillingSnapshot(supabase, providerProfileId)

    if (
      billing?.stripe_subscription_id &&
      billing.status !== "canceled" &&
      billing.status !== "incomplete_expired"
    ) {
      if (
        billing.plan_id === planId &&
        billing.billing_interval === billingPeriodToStripeInterval(billingPeriod)
      ) {
        return NextResponse.json(
          { error: "You are already on that subscription." },
          { status: 409 },
        )
      }

      if (!billing.stripe_customer_id) {
        return NextResponse.json(
          { error: "Your billing profile is missing a Stripe customer record." },
          { status: 409 },
        )
      }

      const stripe = getStripeServerClient()
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: billing.stripe_customer_id,
        return_url: getStripeBillingPortalReturnUrl(),
      })

      return NextResponse.json({
        redirect: "portal",
        url: portalSession.url,
        currentPlanId: providerPlanId,
      })
    }

    const { data: providerProfile, error: providerProfileError } = await supabase
      .from("provider_profiles")
      .select("business_name")
      .eq("profile_id", providerProfileId)
      .maybeSingle()

    if (providerProfileError) {
      return NextResponse.json({ error: providerProfileError.message }, { status: 500 })
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Your account is missing an email address." },
        { status: 400 },
      )
    }

    const stripe = getStripeServerClient()
    const customerId = await getOrCreateStripeCustomerForProvider({
      providerProfileId,
      providerName: providerProfile?.business_name,
      email: user.email,
    })

    const siteUrl = getSiteUrl()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: providerProfileId,
      line_items: [
        {
          price: getStripePriceId(planId, billingPeriod),
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/dashboard/provider/subscription?checkout=success`,
      cancel_url: `${siteUrl}/dashboard/provider/subscription?checkout=canceled`,
      metadata: {
        provider_profile_id: providerProfileId,
        plan_id: planId,
        billing_interval: billingPeriodToStripeInterval(billingPeriod),
      },
      subscription_data: {
        metadata: {
          provider_profile_id: providerProfileId,
          plan_id: planId,
          billing_interval: billingPeriodToStripeInterval(billingPeriod),
        },
      },
    })

    return NextResponse.json({
      redirect: "checkout",
      sessionId: session.id,
      url: session.url,
      planId,
      billingPeriod,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the checkout session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
