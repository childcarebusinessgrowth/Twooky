"use server"

import { revalidatePath } from "next/cache"
import { assertAdminPermission } from "@/lib/authzServer"
import { PLAN_IDS, type PlanId } from "@/lib/pricing-data"
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

  const rows: AdminProviderPlanRow[] = (data ?? []).map((row) => ({
    profile_id: row.profile_id,
    provider_slug: row.provider_slug,
    business_name: row.business_name,
    city: row.city,
    listing_status: row.listing_status ?? "pending",
    featured: row.featured ?? false,
    plan_id: isPlanId(row.plan_id) ? row.plan_id : "sprout",
  }))

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
  const { error } = await supabase
    .from("provider_profiles")
    .update({ plan_id: planId })
    .eq("profile_id", normalizedProfileId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(PROVIDER_PLANS_PATH)
}
