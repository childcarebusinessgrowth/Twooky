import { NextResponse } from "next/server"
import { resolveRoleForUser } from "@/lib/authz"
import { getProviderBillingSnapshot } from "@/lib/provider-billing"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getStripeBillingPortalReturnUrl, getStripeServerClient } from "@/lib/stripe"

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "billing-portal",
    limit: 10,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
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
    const { billing } = await getProviderBillingSnapshot(supabase, providerProfileId)
    if (!billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe billing profile was found for this provider." },
        { status: 409 },
      )
    }

    const stripe = getStripeServerClient()
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: getStripeBillingPortalReturnUrl(),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to open the billing portal."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
