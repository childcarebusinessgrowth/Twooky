import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"
import { formatAgeRangeValues } from "@/lib/age-range-label"

type TypedClient = SupabaseClient<Database>

export type RecentInquiryRow = {
  id: string
  type: "thread" | "guest"
  parentName: string
  childAge: string
  messagePreview: string
  date: string
  status: "new" | "replied"
}

export type ProviderOverviewData = {
  profileViews: number
  profileViewsPrevMonth: number
  inquiryCount: number
  guestInquiryCount: number
  reviewCount: number
  reviewCountThisMonth: number
  averageRating: number | null
  recentInquiries: RecentInquiryRow[]
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function formatFallbackParentName(email: string | null | undefined): string {
  const localPart = email?.split("@")[0]?.trim()
  if (!localPart) return "Parent"
  const withSpaces = localPart.replace(/[._-]+/g, " ").trim()
  if (!withSpaces) return "Parent"
  return withSpaces
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function resolveParentName(displayName: string | null | undefined, email: string | null | undefined): string {
  const trimmed = displayName?.trim()
  if (trimmed) return trimmed
  return formatFallbackParentName(email)
}

function formatChildAgeFromDob(childDob: string | null | undefined): string {
  if (!childDob) return ","
  const dob = new Date(`${childDob}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) return ","

  const now = new Date()
  let months =
    (now.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - dob.getUTCMonth())

  if (now.getUTCDate() < dob.getUTCDate()) months -= 1
  if (months < 0) return ","

  if (months < 24) return `${months} mo`
  const years = Math.floor(months / 12)
  const remainderMonths = months % 12
  if (remainderMonths === 0) return `${years} yr${years === 1 ? "" : "s"}`
  return `${years}y ${remainderMonths}m`
}

function formatChildAgeGroup(childAgeGroup: string[] | string | null | undefined): string {
  return formatAgeRangeValues(childAgeGroup) ?? ","
}

export async function getProviderOverviewData(
  supabase: TypedClient,
  providerProfileId: string
): Promise<ProviderOverviewData> {
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1))
  const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1))
  const thisMonthStartIso = thisMonthStart.toISOString()
  const lastMonthStartIso = lastMonthStart.toISOString()
  const lastMonthEndIso = lastMonthEnd.toISOString()

  const [
    viewsResult,
    viewsPrevResult,
    inquiryCountResult,
    guestCountResult,
    reviewsResult,
    reviewsThisMonthResult,
    inquiryPreviewsResult,
    guestInquiriesResult,
    repliedIdsResult,
  ] = await Promise.all([
    supabase
      .from("provider_profile_views")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", providerProfileId),
    supabase
      .from("provider_profile_views")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", providerProfileId)
      .gte("viewed_at", lastMonthStartIso)
      .lte("viewed_at", lastMonthEndIso),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", providerProfileId)
      .is("deleted_at", null),
    supabase
      .from("guest_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", providerProfileId),
    supabase
      .from("parent_reviews")
      .select("id, rating")
      .eq("provider_profile_id", providerProfileId),
    supabase
      .from("parent_reviews")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", providerProfileId)
      .gte("created_at", thisMonthStartIso),
    supabase.rpc("get_provider_inquiry_previews"),
    supabase
      .from("guest_inquiries")
      .select("id, first_name, last_name, child_dob, created_at")
      .eq("provider_profile_id", providerProfileId)
      .order("created_at", { ascending: false })
      .limit(10),
    (async () => {
      const { data: inquiryIds } = await supabase
        .from("inquiries")
        .select("id")
        .eq("provider_profile_id", providerProfileId)
        .is("deleted_at", null)
      const ids = (inquiryIds ?? []).map((r) => r.id)
      if (ids.length === 0) return new Set<string>()
      const { data: rows } = await supabase
        .from("inquiry_messages")
        .select("inquiry_id")
        .in("inquiry_id", ids)
        .eq("sender_type", "provider")
      return new Set((rows ?? []).map((r) => r.inquiry_id))
    })(),
  ])

  const profileViews = viewsResult.count ?? 0
  const profileViewsPrevMonth = viewsPrevResult.count ?? 0
  const inquiryCount = inquiryCountResult.count ?? 0
  const guestInquiryCount = guestCountResult.count ?? 0
  const reviewRows = reviewsResult.data ?? []
  const reviewCount = reviewRows.length
  const reviewCountThisMonth = reviewsThisMonthResult.count ?? 0
  const averageRating =
    reviewCount > 0
      ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewCount
      : null

  const repliedIds = await repliedIdsResult

  const inquiryList = (inquiryPreviewsResult.data ?? []).map((row) => ({
    id: row.id,
    type: "thread" as const,
    parentName: resolveParentName(row.parent_display_name, row.parent_email),
    childAge: formatChildAgeGroup((row as { child_age_groups?: string[] | null }).child_age_groups),
    messagePreview: row.inquiry_subject?.trim() || "Message sent",
    date: row.updated_at,
    status: (repliedIds.has(row.id) ? "replied" : "new") as "new" | "replied",
  }))

  const guestList = (guestInquiriesResult.data ?? []).map((row) => ({
    id: row.id,
    type: "guest" as const,
    parentName: `${row.first_name} ${row.last_name}`.trim() || "Guest",
    childAge: formatChildAgeFromDob(row.child_dob),
    messagePreview: "Guest inquiry",
    date: row.created_at,
    status: "new" as const,
  }))

  const recentInquiries: RecentInquiryRow[] = [...inquiryList, ...guestList]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return {
    profileViews,
    profileViewsPrevMonth,
    inquiryCount,
    guestInquiryCount,
    reviewCount,
    reviewCountThisMonth,
    averageRating,
    recentInquiries,
  }
}
