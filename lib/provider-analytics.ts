import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>

export type DateRangeKey = "7days" | "30days" | "3months" | "12months"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function getRangeStart(range: DateRangeKey): Date {
  const now = new Date()
  const start = new Date(now)
  switch (range) {
    case "7days":
      start.setDate(now.getDate() - 7)
      break
    case "30days":
      start.setDate(now.getDate() - 30)
      break
    case "3months":
      start.setMonth(now.getMonth() - 3)
      break
    case "12months":
      start.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setFullYear(now.getFullYear() - 1)
  }
  start.setHours(0, 0, 0, 0)
  return start
}

function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthKeyToLabel(key: string): string {
  const [, m] = key.split("-").map(Number)
  return MONTH_LABELS[m - 1] ?? key
}

export type ViewsByMonthRow = { month: string; views: number }
export type InquiriesByMonthRow = { month: string; inquiries: number; converted: number }
export type ReviewsByMonthRow = { month: string; reviews: number }

export type ProviderAnalyticsData = {
  viewsByMonth: ViewsByMonthRow[]
  inquiriesByMonth: InquiriesByMonthRow[]
  reviewsByMonth: ReviewsByMonthRow[]
  conversionRatePercent: number | null
  avgResponseTimeHours: number | null
  searchRank: number | null
  searchRankAreaLabel: string
}

function fillMonthBuckets<T extends { month: string }>(
  buckets: Map<string, T>,
  rangeStart: Date,
  rangeEnd: Date,
  toRow: (key: string) => T
): T[] {
  const result: T[] = []
  const end = new Date(rangeEnd)
  const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cur <= end) {
    const key = toMonthKey(cur)
    result.push(buckets.get(key) ?? toRow(monthKeyToLabel(key)))
    cur.setMonth(cur.getMonth() + 1)
  }
  return result
}

export async function getProviderAnalytics(
  supabase: TypedClient,
  providerProfileId: string,
  dateRange: DateRangeKey
): Promise<ProviderAnalyticsData> {
  const rangeStart = getRangeStart(dateRange)
  const rangeEnd = new Date()
  const rangeStartIso = rangeStart.toISOString()
  const rangeEndIso = rangeEnd.toISOString()

  const [
    viewsRows,
    inquiriesRows,
    guestInquiriesRows,
    reviewsRows,
    inquiryIdsWithFirstReply,
    rankingData,
  ] = await Promise.all([
    supabase
      .from("provider_profile_views")
      .select("viewed_at")
      .eq("provider_profile_id", providerProfileId)
      .gte("viewed_at", rangeStartIso)
      .lte("viewed_at", rangeEndIso),
    supabase
      .from("inquiries")
      .select("id, created_at, lead_status")
      .eq("provider_profile_id", providerProfileId)
      .is("deleted_at", null)
      .gte("created_at", rangeStartIso)
      .lte("created_at", rangeEndIso),
    supabase
      .from("guest_inquiries")
      .select("id, created_at")
      .eq("provider_profile_id", providerProfileId)
      .gte("created_at", rangeStartIso)
      .lte("created_at", rangeEndIso),
    supabase
      .from("parent_reviews")
      .select("id, created_at")
      .eq("provider_profile_id", providerProfileId)
      .gte("created_at", rangeStartIso)
      .lte("created_at", rangeEndIso),
    getFirstResponseTimes(supabase, providerProfileId, rangeStartIso, rangeEndIso),
    getSearchRanking(supabase, providerProfileId),
  ])

  const viewsByMonth = aggregateViewsByMonth(viewsRows.data ?? [], rangeStart, rangeEnd)
  const inquiriesByMonth = aggregateInquiriesByMonth(
    inquiriesRows.data ?? [],
    guestInquiriesRows.data ?? [],
    rangeStart,
    rangeEnd
  )
  const reviewsByMonth = aggregateReviewsByMonth(reviewsRows.data ?? [], rangeStart, rangeEnd)
  const conversionRatePercent = computeConversionRateFromLeadStatus(inquiriesRows.data ?? [])
  const avgResponseTimeHours = inquiryIdsWithFirstReply.avgResponseTimeHours

  return {
    viewsByMonth,
    inquiriesByMonth,
    reviewsByMonth,
    conversionRatePercent,
    avgResponseTimeHours,
    searchRank: rankingData.rank,
    searchRankAreaLabel: rankingData.areaLabel,
  }
}

function aggregateViewsByMonth(
  rows: { viewed_at: string }[],
  rangeStart: Date,
  rangeEnd: Date
): ViewsByMonthRow[] {
  const buckets = new Map<string, ViewsByMonthRow>()
  for (const row of rows) {
    const d = new Date(row.viewed_at)
    const key = toMonthKey(d)
    const label = monthKeyToLabel(key)
    const cur = buckets.get(key) ?? { month: label, views: 0 }
    cur.views += 1
    buckets.set(key, cur)
  }
  return fillMonthBuckets(buckets, rangeStart, rangeEnd, (label) => ({ month: label, views: 0 }))
}

function aggregateInquiriesByMonth(
  inquiries: { id: string; created_at: string; lead_status?: string | null }[],
  guestInquiries: { id: string; created_at: string }[],
  rangeStart: Date,
  rangeEnd: Date
): InquiriesByMonthRow[] {
  const buckets = new Map<string, { month: string; inquiries: number; converted: number }>()
  const add = (createdAt: string, isConverted = false) => {
    const d = new Date(createdAt)
    const key = toMonthKey(d)
    const label = monthKeyToLabel(key)
    const cur = buckets.get(key) ?? { month: label, inquiries: 0, converted: 0 }
    cur.inquiries += 1
    if (isConverted) cur.converted += 1
    buckets.set(key, cur)
  }
  for (const row of inquiries) {
    add(row.created_at, (row.lead_status ?? "new") === "enrolled")
  }
  for (const row of guestInquiries) {
    add(row.created_at, false)
  }
  return fillMonthBuckets(buckets, rangeStart, rangeEnd, (label) => ({
    month: label,
    inquiries: 0,
    converted: 0,
  }))
}

function aggregateReviewsByMonth(
  rows: { created_at: string }[],
  rangeStart: Date,
  rangeEnd: Date
): ReviewsByMonthRow[] {
  const buckets = new Map<string, ReviewsByMonthRow>()
  for (const row of rows) {
    const d = new Date(row.created_at)
    const key = toMonthKey(d)
    const label = monthKeyToLabel(key)
    const cur = buckets.get(key) ?? { month: label, reviews: 0 }
    cur.reviews += 1
    buckets.set(key, cur)
  }
  return fillMonthBuckets(buckets, rangeStart, rangeEnd, (label) => ({ month: label, reviews: 0 }))
}

function computeConversionRateFromLeadStatus(
  inquiries: { id: string; lead_status?: string | null }[]
): number | null {
  const total = inquiries.length
  if (total === 0) return null
  const converted = inquiries.filter((i) => (i.lead_status ?? "new") === "enrolled").length
  return Math.round((converted / total) * 1000) / 10
}

async function getFirstResponseTimes(
  supabase: TypedClient,
  providerProfileId: string,
  rangeStartIso: string,
  rangeEndIso: string
): Promise<{
  avgResponseTimeHours: number | null
}> {
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id, created_at")
    .eq("provider_profile_id", providerProfileId)
    .is("deleted_at", null)
    .gte("created_at", rangeStartIso)
    .lte("created_at", rangeEndIso)

  const inquiryIds = (inquiries ?? []).map((r) => r.id)
  if (inquiryIds.length === 0) {
    return { avgResponseTimeHours: null }
  }

  const { data: messages } = await supabase
    .from("inquiry_messages")
    .select("inquiry_id, created_at")
    .in("inquiry_id", inquiryIds)
    .eq("sender_type", "provider")
    .order("created_at", { ascending: true })

  const firstReplyByInquiry = new Map<string, string>()
  for (const m of messages ?? []) {
    if (!firstReplyByInquiry.has(m.inquiry_id)) firstReplyByInquiry.set(m.inquiry_id, m.created_at)
  }

  const deltas: number[] = []
  const inquiryByCreated = new Map((inquiries ?? []).map((i) => [i.id, i.created_at]))
  for (const [inquiryId, firstReplyAt] of firstReplyByInquiry) {
    const created = inquiryByCreated.get(inquiryId)
    if (created) {
      const ms = new Date(firstReplyAt).getTime() - new Date(created).getTime()
      if (ms >= 0) deltas.push(ms / (1000 * 60 * 60))
    }
  }
  const avgResponseTimeHours =
    deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null

  return { avgResponseTimeHours }
}

type RankingRow = {
  profile_id: string
  city: string | null
  city_id: string | null
  featured: boolean
  created_at: string
}

async function getSearchRanking(
  supabase: TypedClient,
  providerProfileId: string
): Promise<{ rank: number | null; areaLabel: string }> {
  const { data: current } = await supabase
    .from("provider_profiles")
    .select("profile_id, city, city_id")
    .eq("profile_id", providerProfileId)
    .maybeSingle()

  if (!current) {
    return { rank: null, areaLabel: "your area" }
  }

  const areaLabel = current.city?.trim() || "your area"
  let query = supabase
    .from("provider_profiles")
    .select("profile_id, city, city_id, featured, created_at")
    .eq("listing_status", "active")
  if (current.city_id) {
    query = query.eq("city_id", current.city_id)
  } else if (current.city) {
    query = query.eq("city", current.city)
  } else {
    return { rank: null, areaLabel }
  }
  const { data: profiles } = (await query) as { data: RankingRow[] | null }

  const profileIds = (profiles ?? []).map((p) => p.profile_id)
  if (profileIds.length === 0) return { rank: null, areaLabel }

  const { data: inquiriesData } = await supabase
    .from("inquiries")
    .select("id, provider_profile_id")
    .in("provider_profile_id", profileIds)
    .is("deleted_at", null)
  const inquiryIdsForArea = (inquiriesData ?? []).map((r) => r.id)
  const [reviewsData, messagesData] = await Promise.all([
    supabase.from("parent_reviews").select("provider_profile_id, rating").in("provider_profile_id", profileIds),
    inquiryIdsForArea.length > 0
      ? supabase
          .from("inquiry_messages")
          .select("inquiry_id")
          .in("inquiry_id", inquiryIdsForArea)
          .eq("sender_type", "provider")
      : Promise.resolve({ data: [] as { inquiry_id: string }[] }),
  ])

  const inquiryIdsWithReply = new Set(
    (messagesData.data ?? []).map((r) => r.inquiry_id).filter(Boolean)
  )
  const providerRepliedCount = new Map<string, number>()
  const providerTotalInquiries = new Map<string, number>()
  for (const row of inquiriesData ?? []) {
    const pid = row.provider_profile_id
    providerTotalInquiries.set(pid, (providerTotalInquiries.get(pid) ?? 0) + 1)
    if (inquiryIdsWithReply.has(row.id)) {
      providerRepliedCount.set(pid, (providerRepliedCount.get(pid) ?? 0) + 1)
    }
  }

  const reviewCountByProfile = new Map<string, { count: number; sum: number }>()
  for (const id of profileIds) reviewCountByProfile.set(id, { count: 0, sum: 0 })
  for (const r of reviewsData.data ?? []) {
    const cur = reviewCountByProfile.get(r.provider_profile_id)
    if (cur) {
      cur.count += 1
      cur.sum += r.rating
    }
  }

  const now = new Date()
  const maxReviewCount = Math.max(
    1,
    ...Array.from(reviewCountByProfile.values()).map((v) => v.count)
  )

  const scores: { profile_id: string; score: number }[] = []
  for (const p of profiles ?? []) {
    const rev = reviewCountByProfile.get(p.profile_id) ?? { count: 0, sum: 0 }
    const reviewCount = rev.count
    const rating = reviewCount > 0 ? rev.sum / reviewCount : 0
    const totalInq = providerTotalInquiries.get(p.profile_id) ?? 0
    const replied = providerRepliedCount.get(p.profile_id) ?? 0
    const responseRate = totalInq > 0 ? replied / totalInq : 0
    const updatedAt = new Date(p.created_at)
    const daysSinceUpdate = Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    const recencyScore = Math.exp(-daysSinceUpdate / 365)
    const profileScore = 0.7
    const ratingScore = rating / 5
    const volumeNorm =
      maxReviewCount > 0 ? Math.log(reviewCount + 1) / Math.log(maxReviewCount + 1) : 0
    const subscriptionBoost = p.featured ? 0.15 : 0
    const score =
      0.2 * profileScore +
      0.25 * ratingScore +
      0.15 * volumeNorm +
      0.15 * recencyScore +
      0.15 * responseRate +
      0.05 * subscriptionBoost
    scores.push({ profile_id: p.profile_id, score })
  }

  scores.sort((a, b) => b.score - a.score)
  const rankIndex = scores.findIndex((s) => s.profile_id === providerProfileId)
  const rank = rankIndex >= 0 ? rankIndex + 1 : null
  return { rank, areaLabel }
}
