import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export type DashboardStat = {
  title: string
  value: string
  change: string
  description: string
  trend?: "up" | "down" | "neutral"
}

export type RecentActivityItem = {
  id: string
  type: "claim" | "review" | "listing" | "user" | "flagged" | "contact"
  message: string
  time: string
  status: string
}

export type TopProviderItem = {
  name: string
  inquiries: number
  rating: number | null
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function getTodayBounds(now: Date): { start: string; end: string } {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const start = new Date(y, m, d, 0, 0, 0, 0)
  const end = new Date(y, m, d, 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function getMonthBounds(now: Date): {
  thisMonthStart: string
  thisMonthEnd: string
  lastMonthStart: string
  lastMonthEnd: string
} {
  const y = now.getFullYear()
  const m = now.getMonth()
  const thisMonthStart = new Date(y, m, 1)
  const thisMonthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999)
  const lastMonthStart = new Date(y, m - 1, 1)
  const lastMonthEnd = new Date(y, m, 0, 23, 59, 59, 999)
  return {
    thisMonthStart: thisMonthStart.toISOString(),
    thisMonthEnd: thisMonthEnd.toISOString(),
    lastMonthStart: lastMonthStart.toISOString(),
    lastMonthEnd: lastMonthEnd.toISOString(),
  }
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return d.toLocaleDateString()
}

export async function loadAdminDashboardData(): Promise<{
  stats: DashboardStat[]
  recentActivity: RecentActivityItem[]
  topProviders: TopProviderItem[]
}> {
  const supabase = getSupabaseAdminClient()
  const now = new Date()
  const { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } = getMonthBounds(now)

  const [
    providersCountRes,
    providersThisMonthRes,
    reviewsCountRes,
    reviewsThisMonthRes,
    listingsThisMonthRes,
    listingsLastMonthRes,
    providerSignupsRes,
    newListingsRes,
    newReviewsRes,
    flaggedReviewsRes,
    recentContactMessagesRes,
    providerProfilesRes,
    inquiriesCountRes,
    reviewsAggRes,
  ] = await Promise.all([
    supabase.from("provider_profiles").select("profile_id", { count: "exact", head: true }),
    supabase
      .from("provider_profiles")
      .select("profile_id", { count: "exact", head: true })
      .gte("created_at", thisMonthStart)
      .lte("created_at", thisMonthEnd),
    supabase.from("parent_reviews").select("id", { count: "exact", head: true }),
    supabase
      .from("parent_reviews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thisMonthStart)
      .lte("created_at", thisMonthEnd),
    supabase
      .from("provider_profiles")
      .select("profile_id", { count: "exact", head: true })
      .gte("created_at", thisMonthStart)
      .lte("created_at", thisMonthEnd),
    supabase
      .from("provider_profiles")
      .select("profile_id", { count: "exact", head: true })
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd),
    supabase
      .from("profiles")
      .select("id, display_name, email, created_at")
      .eq("role", "provider")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("provider_profiles")
      .select("profile_id, business_name, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("parent_reviews")
      .select("id, provider_profile_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("review_reports")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("contact_messages")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("provider_profiles").select("profile_id, business_name"),
    supabase
      .from("inquiries")
      .select("provider_profile_id")
      .is("deleted_at", null),
    supabase.from("parent_reviews").select("provider_profile_id, rating"),
  ])

  const totalProviders = providersCountRes.count ?? 0
  const providersThisMonth = providersThisMonthRes.count ?? 0
  const totalReviews = reviewsCountRes.count ?? 0
  const reviewsThisMonth = reviewsThisMonthRes.count ?? 0
  const listingsThisMonth = listingsThisMonthRes.count ?? 0
  const listingsLastMonth = listingsLastMonthRes.count ?? 0

  const lastMonthCount = listingsLastMonth || 1
  const listingsChange = listingsThisMonth - listingsLastMonth
  const listingsChangePct = Math.round((listingsChange / lastMonthCount) * 100)
  const newListingsChange =
    listingsChange >= 0 ? `+${listingsChangePct}%` : `${listingsChangePct}%`
  const newListingsTrend: "up" | "down" | "neutral" =
    listingsChange > 0 ? "up" : listingsChange < 0 ? "down" : "neutral"

  const stats: DashboardStat[] = [
    {
      title: "Total Providers",
      value: formatNumber(totalProviders),
      change: `+${providersThisMonth}`,
      description: "new this month",
      trend: "up",
    },
    {
      title: "Total Reviews",
      value: formatNumber(totalReviews),
      change: `+${reviewsThisMonth}`,
      description: "new this month",
      trend: "up",
    },
    {
      title: "Pending Claims",
      value: "0",
      change: "0",
      description: "need review",
      trend: "neutral",
    },
    {
      title: "New Listings",
      value: String(listingsThisMonth),
      change: newListingsChange,
      description: "vs last month",
      trend: newListingsTrend,
    },
  ]

  type ActivityRow = { id: string; message: string; time: string; type: RecentActivityItem["type"]; status: string }
  const activities: ActivityRow[] = []

  const signups = (providerSignupsRes.data ?? []) as { id: string; display_name: string | null; email: string; created_at: string }[]
  signups.forEach((p) => {
    activities.push({
      id: `signup-${p.id}`,
      message: `New provider signup: ${p.display_name?.trim() || p.email || p.id}`,
      time: p.created_at,
      type: "user",
      status: "new",
    })
  })

  const newListings = (newListingsRes.data ?? []) as { profile_id: string; business_name: string | null; created_at: string }[]
  newListings.forEach((l) => {
    activities.push({
      id: `listing-${l.profile_id}`,
      message: `New listing: ${l.business_name?.trim() || "Unnamed"}`,
      time: l.created_at,
      type: "listing",
      status: "new",
    })
  })

  const reviews = (newReviewsRes.data ?? []) as { id: string; provider_profile_id: string; created_at: string }[]
  const providerNames = new Map((providerProfilesRes.data ?? []).map((r: { profile_id: string; business_name: string | null }) => [r.profile_id, r.business_name?.trim() || "Unknown"]))
  for (const r of reviews) {
    const name = providerNames.get(r.provider_profile_id) ?? "Unknown"
    activities.push({
      id: `review-${r.id}`,
      message: `Parent review submitted for ${name}`,
      time: r.created_at,
      type: "review",
      status: "new",
    })
  }

  const flagged = (flaggedReviewsRes.data ?? []) as { id: string; created_at: string }[]
  flagged.forEach((f) => {
    activities.push({
      id: `flagged-${f.id}`,
      message: "Review flagged for moderation",
      time: f.created_at,
      type: "flagged",
      status: "flagged",
    })
  })

  const contactMessages = (recentContactMessagesRes.data ?? []) as { id: string; name: string; email: string; created_at: string }[]
  contactMessages.forEach((c) => {
    activities.push({
      id: `contact-${c.id}`,
      message: `New contact message from ${c.name?.trim() || c.email || "Unknown"}`,
      time: c.created_at,
      type: "contact",
      status: "new",
    })
  })

  const { start: todayStart, end: todayEnd } = getTodayBounds(now)
  const todayActivities = activities.filter((a) => {
    const t = new Date(a.time).getTime()
    return t >= new Date(todayStart).getTime() && t <= new Date(todayEnd).getTime()
  })
  todayActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const recentActivity: RecentActivityItem[] = todayActivities.slice(0, 10).map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    time: relativeTime(a.time),
    status: a.status,
  }))

  const providers = (providerProfilesRes.data ?? []) as { profile_id: string; business_name: string | null }[]
  const inquiries = (inquiriesCountRes.data ?? []) as { provider_profile_id: string }[]
  const reviewRows = (reviewsAggRes.data ?? []) as { provider_profile_id: string; rating: number }[]

  const inquiryCountByProvider = new Map<string, number>()
  for (const i of inquiries) {
    inquiryCountByProvider.set(i.provider_profile_id, (inquiryCountByProvider.get(i.provider_profile_id) ?? 0) + 1)
  }
  const ratingByProvider = new Map<string, { sum: number; count: number }>()
  for (const r of reviewRows) {
    const cur = ratingByProvider.get(r.provider_profile_id) ?? { sum: 0, count: 0 }
    cur.sum += r.rating
    cur.count += 1
    ratingByProvider.set(r.provider_profile_id, cur)
  }

  const topProviderData: TopProviderItem[] = providers.map((p) => ({
    name: p.business_name?.trim() || "Unnamed",
    inquiries: inquiryCountByProvider.get(p.profile_id) ?? 0,
    rating: (() => {
      const agg = ratingByProvider.get(p.profile_id)
      if (!agg || agg.count === 0) return null
      return Math.round((agg.sum / agg.count) * 10) / 10
    })(),
  }))

  topProviderData.sort((a, b) => b.inquiries - a.inquiries)
  const topProviders = topProviderData.slice(0, 5)

  return { stats, recentActivity, topProviders }
}

export type ContactMessageRow = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  consent_to_contact: boolean
  consent_version: string
  consented_at: string
  handled_status: string
  admin_note: string | null
  created_at: string
}

const CONTACT_MESSAGES_PAGE_SIZE = 50

export async function loadContactMessages(): Promise<{
  messages: ContactMessageRow[]
  error: string | null
}> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, phone, message, consent_to_contact, consent_version, consented_at, handled_status, admin_note, created_at")
      .order("created_at", { ascending: false })
      .limit(CONTACT_MESSAGES_PAGE_SIZE)
    if (error) return { messages: [], error: error.message }
    return { messages: (data ?? []) as ContactMessageRow[], error: null }
  } catch (e) {
    return {
      messages: [],
      error: e instanceof Error ? e.message : "Failed to load contact messages",
    }
  }
}
