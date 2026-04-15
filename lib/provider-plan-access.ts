import type { SupabaseClient } from "@supabase/supabase-js"
import { PLAN_IDS, type PlanId } from "@/lib/pricing-data"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>

export type ProviderDashboardSection =
  | "overview"
  | "listing"
  | "availability"
  | "reviews"
  | "inquiries"
  | "photos"
  | "faqs"
  | "website"
  | "analytics"
  | "subscription"
  | "settings"

const SPROUT_VISIBLE_DASHBOARD_SECTIONS: ProviderDashboardSection[] = [
  "overview",
  "listing",
  "subscription",
  "settings",
]

export type ProviderPlanAccess = {
  planId: PlanId
  isSprout: boolean
  isGrow: boolean
  isThrive: boolean
  isKinderPathPro: boolean
  isThriveTier: boolean
  canAccessEnhancedListing: boolean
  canAccessAvailability: boolean
  canAccessReviews: boolean
  canAccessInquiries: boolean
  canReceivePublicInquiries: boolean
  canAccessFavoriteLeads: boolean
  canManageInquiryStatuses: boolean
  canManageLeadNotes: boolean
  canExportLeads: boolean
  canAccessProviderSearch: boolean
  canAccessPhotos: boolean
  canAccessFaqs: boolean
  canAccessWebsite: boolean
  canAccessAnalytics: boolean
  publicListingMode: "basics" | "full"
  visibleDashboardSections: ProviderDashboardSection[]
}

export function normalizeProviderPlanId(value: string | null | undefined): PlanId {
  return value != null && PLAN_IDS.includes(value as PlanId) ? (value as PlanId) : "sprout"
}

export function getProviderPlanAccess(planIdInput: string | null | undefined): ProviderPlanAccess {
  const planId = normalizeProviderPlanId(planIdInput)
  const isSprout = planId === "sprout"
  const isGrow = planId === "grow"
  const isThrive = planId === "thrive"
  const isKinderPathPro = planId === "kinderpathPro"
  const isThriveTier = isThrive || isKinderPathPro
  const visibleDashboardSections = isSprout
    ? SPROUT_VISIBLE_DASHBOARD_SECTIONS
    : isGrow
      ? ([
          "overview",
          "listing",
          "reviews",
          "inquiries",
          "photos",
          "faqs",
          "analytics",
          "subscription",
          "settings",
        ] satisfies ProviderDashboardSection[])
      : ([
          "overview",
          "listing",
          "availability",
          "reviews",
          "inquiries",
          "photos",
          "faqs",
          "website",
          "analytics",
          "subscription",
          "settings",
        ] satisfies ProviderDashboardSection[])

  return {
    planId,
    isSprout,
    isGrow,
    isThrive,
    isKinderPathPro,
    isThriveTier,
    canAccessEnhancedListing: !isSprout,
    canAccessAvailability: isThriveTier,
    canAccessReviews: !isSprout,
    canAccessInquiries: !isSprout,
    canReceivePublicInquiries: !isSprout,
    canAccessFavoriteLeads: isThriveTier,
    canManageInquiryStatuses: isThriveTier,
    canManageLeadNotes: isThriveTier,
    canExportLeads: isThriveTier,
    canAccessProviderSearch: isThriveTier,
    canAccessPhotos: !isSprout,
    canAccessFaqs: !isSprout,
    canAccessWebsite: isThriveTier,
    canAccessAnalytics: !isSprout,
    publicListingMode: isSprout ? "basics" : "full",
    visibleDashboardSections,
  }
}

export function shouldAutoGrantVerifiedBadgeOnApproval(planIdInput: string | null | undefined): boolean {
  return normalizeProviderPlanId(planIdInput) === "thrive"
}

export function getDirectoryPlanPriority(planIdInput: string | null | undefined): number {
  switch (normalizeProviderPlanId(planIdInput)) {
    case "kinderpathPro":
      return 3
    case "thrive":
      return 2
    case "grow":
      return 1
    case "sprout":
    default:
      return 0
  }
}

export function canAccessProviderDashboardSection(
  planIdInput: string | null | undefined,
  section: ProviderDashboardSection,
): boolean {
  return getProviderPlanAccess(planIdInput).visibleDashboardSections.includes(section)
}

export async function getProviderPlanAccessByProfileId(
  supabase: TypedClient,
  providerProfileId: string,
): Promise<ProviderPlanAccess> {
  const { data } = await supabase
    .from("provider_profiles")
    .select("plan_id")
    .eq("profile_id", providerProfileId)
    .maybeSingle()

  return getProviderPlanAccess(data?.plan_id)
}

export async function getProviderPlanAccessForUser(
  supabase: TypedClient,
  userId: string,
): Promise<ProviderPlanAccess & { providerProfileId: string }> {
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, userId)
  const access = await getProviderPlanAccessByProfileId(supabase, providerProfileId)

  return {
    ...access,
    providerProfileId,
  }
}
