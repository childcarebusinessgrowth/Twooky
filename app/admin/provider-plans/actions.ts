"use server"

import { revalidatePath } from "next/cache"
import { assertAdminPermission } from "@/lib/authzServer"
import { PLAN_IDS, type PlanId } from "@/lib/pricing-data"
import { shouldAutoGrantVerifiedBadgeOnApproval } from "@/lib/provider-plan-access"
import {
  formatProviderBillingInterval,
  formatProviderBillingStatus,
  hasPaidSubscriptionEntitlement,
  type ProviderBillingInterval,
  type ProviderBillingStatus,
} from "@/lib/provider-billing"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const PROVIDER_PLANS_PATH = "/admin/provider-plans"

export type ProviderPlanFilter = "all" | PlanId

export type AdminProviderPlanRow = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
  listing_status: string
  featured: boolean
  plan_id: PlanId
  billing_plan_id: PlanId | null
  billing_status: ProviderBillingStatus | null
  billing_status_label: string | null
  billing_interval: ProviderBillingInterval | null
  billing_interval_label: string | null
  billing_current_period_end: string | null
  billing_cancel_at_period_end: boolean
  has_stripe_subscription: boolean
  has_paid_subscription: boolean
}

export type GetAdminProviderPlansOptions = {
  page?: number
  pageSize?: number
  search?: string
  plan?: ProviderPlanFilter
}

function sanitizeSearchTermForFilter(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isPlanId(value: string | null | undefined): value is PlanId {
  return value != null && PLAN_IDS.includes(value as PlanId)
}

function isProviderBillingInterval(
  value: string | null | undefined,
): value is ProviderBillingInterval {
  return value === "month" || value === "year"
}

function isProviderBillingStatus(
  value: string | null | undefined,
): value is ProviderBillingStatus {
  return (
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "unpaid" ||
    value === "paused" ||
    value === "incomplete" ||
    value === "incomplete_expired" ||
    value === "canceled"
  )
}

export async function getAdminProviderPlans(
  options: GetAdminProviderPlansOptions = {}
): Promise<{ rows: AdminProviderPlanRow[]; total: number }> {
  await assertAdminPermission("listings.manage")

  const supabase = getSupabaseAdminClient()
  const page = Math.max(1, options.page ?? 1)
  const pageSize = options.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("provider_profiles")
    .select(
      "profile_id, provider_slug, business_name, city, listing_status, featured, plan_id",
      { count: "exact" }
    )
    .order("business_name", { ascending: true })
    .range(from, to)

  if (isPlanId(options.plan)) {
    query = query.eq("plan_id", options.plan)
  }

  if (options.search?.trim()) {
    const q = sanitizeSearchTermForFilter(options.search)
    if (q) {
      query = query.or(`business_name.ilike.%${q}%,provider_slug.ilike.%${q}%,city.ilike.%${q}%`)
    }
  }

  const { data, count, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const profileIds = (data ?? []).map((row) => row.profile_id)
  const billingByProfileId = new Map<
    string,
    {
      plan_id: PlanId | null
      status: ProviderBillingStatus | null
      billing_interval: ProviderBillingInterval | null
      current_period_end: string | null
      cancel_at_period_end: boolean
      has_stripe_subscription: boolean
      has_paid_subscription: boolean
    }
  >()

  if (profileIds.length > 0) {
    const { data: billingRows, error: billingError } = await supabase
      .from("provider_billing_subscriptions")
      .select(
        "provider_profile_id, plan_id, status, billing_interval, current_period_end, cancel_at_period_end, stripe_subscription_id",
      )
      .in("provider_profile_id", profileIds)

    if (billingError) {
      throw new Error(billingError.message)
    }

    for (const row of billingRows ?? []) {
      const billingPlanId = row.plan_id != null && isPlanId(row.plan_id) ? row.plan_id : null
      const billingStatus = isProviderBillingStatus(row.status) ? row.status : null
      const billingInterval = isProviderBillingInterval(row.billing_interval)
        ? row.billing_interval
        : null
      const hasStripeSubscription = Boolean(row.stripe_subscription_id)

      billingByProfileId.set(row.provider_profile_id, {
        plan_id: billingPlanId,
        status: billingStatus,
        billing_interval: billingInterval,
        current_period_end: row.current_period_end ?? null,
        cancel_at_period_end: row.cancel_at_period_end ?? false,
        has_stripe_subscription: hasStripeSubscription,
        has_paid_subscription: hasPaidSubscriptionEntitlement({
          stripe_subscription_id: row.stripe_subscription_id,
          status: billingStatus ?? "incomplete",
        }),
      })
    }
  }

  const rows: AdminProviderPlanRow[] = (data ?? []).map((row) => {
    const billing = billingByProfileId.get(row.profile_id)
    const billingStatus = billing?.status ?? null
    const billingInterval = billing?.billing_interval ?? null

    return {
      profile_id: row.profile_id,
      provider_slug: row.provider_slug,
      business_name: row.business_name,
      city: row.city,
      listing_status: row.listing_status ?? "pending",
      featured: row.featured ?? false,
      plan_id: isPlanId(row.plan_id) ? row.plan_id : "sprout",
      billing_plan_id: billing?.plan_id ?? null,
      billing_status: billingStatus,
      billing_status_label: billingStatus
        ? formatProviderBillingStatus(billingStatus, billing?.cancel_at_period_end ?? false)
        : null,
      billing_interval: billingInterval,
      billing_interval_label: billingInterval ? formatProviderBillingInterval(billingInterval) : null,
      billing_current_period_end: billing?.current_period_end ?? null,
      billing_cancel_at_period_end: billing?.cancel_at_period_end ?? false,
      has_stripe_subscription: billing?.has_stripe_subscription ?? false,
      has_paid_subscription: billing?.has_paid_subscription ?? false,
    }
  })

  return {
    rows,
    total: count ?? 0,
  }
}

export async function updateProviderPlan(profileId: string, planId: PlanId) {
  await assertAdminPermission("listings.manage")

  const normalizedProfileId = profileId.trim()
  if (!normalizedProfileId) {
    throw new Error("Provider profile is required.")
  }
  if (!isPlanId(planId)) {
    throw new Error("Plan is invalid.")
  }

  const supabase = getSupabaseAdminClient()
  const shouldGrantVerifiedBadge = shouldAutoGrantVerifiedBadgeOnApproval(planId)
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({
      plan_id: planId,
      ...(shouldGrantVerifiedBadge ? { verified_provider_badge: true } : {}),
    })
    .eq("profile_id", normalizedProfileId)
    .select("provider_slug")
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(PROVIDER_PLANS_PATH)
  revalidatePath("/dashboard/provider")
  revalidatePath("/dashboard/provider/listing")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
}
