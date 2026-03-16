import { Users, Building2, Star, MessageCircle, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { AdminAnalyticsCharts } from "./AdminAnalyticsCharts"
import { AdminAnalyticsDateRangeSelect } from "./AdminAnalyticsDateRangeSelect"
import type { GrowthPoint, ReviewPoint, InquiryPoint, FeaturedProviderPoint } from "./AdminAnalyticsCharts"

type DateRangeKey = "7d" | "30d" | "90d" | "12m"

type AdminAnalyticsPageProps = {
  searchParams?: Promise<{ range?: string }>
}

function getDateRange(range: DateRangeKey): { from: Date; to: Date; bucket: "day" | "month" } {
  const to = new Date()
  const from = new Date(to)

  if (range === "7d") {
    from.setDate(to.getDate() - 7)
    return { from, to, bucket: "day" }
  }
  if (range === "30d") {
    from.setDate(to.getDate() - 30)
    return { from, to, bucket: "day" }
  }
  if (range === "90d") {
    from.setDate(to.getDate() - 90)
    return { from, to, bucket: "month" }
  }

  // 12m
  from.setFullYear(to.getFullYear() - 1)
  return { from, to, bucket: "month" }
}

function formatPeriodLabel(dateStr: string, bucket: "day" | "month"): string {
  const d = new Date(dateStr)
  if (bucket === "day") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
}

function fillTimeBuckets<T extends { period: string }>(
  buckets: Map<string, T>,
  from: Date,
  to: Date,
  bucket: "day" | "month",
  toRow: (key: string) => T
): T[] {
  const result: T[] = []
  if (bucket === "day") {
    const cur = new Date(from)
    cur.setHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      const row = buckets.get(key) ?? toRow(key)
      result.push(row)
      cur.setDate(cur.getDate() + 1)
    }
  } else {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1)
    const end = new Date(to)
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-01`
      const row = buckets.get(key) ?? toRow(key)
      result.push(row)
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return result
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const params = searchParams ? await searchParams : {}
  const range: DateRangeKey =
    params?.range && ["7d", "30d", "90d", "12m"].includes(params.range) ? (params.range as DateRangeKey) : "12m"

  const { from, to, bucket } = getDateRange(range)

  const supabase = await createSupabaseServerClient()

  const [
    totalParentsRes,
    totalProvidersRes,
    totalReviewsRes,
    totalInquiriesRes,
    totalFeaturedRes,
    parentsAggRes,
    providersAggRes,
    reviewsAggRes,
    inquiriesAggRes,
    featuredAggRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "provider"),
    supabase.from("parent_reviews").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("provider_profiles")
      .select("profile_id", { count: "exact", head: true })
      .eq("featured", true)
      .eq("listing_status", "active"),
    supabase
      .from("parent_profiles")
      .select("profile_id, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
    supabase
      .from("provider_profiles")
      .select("profile_id, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
    supabase
      .from("parent_reviews")
      .select("id, rating, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
    supabase
      .from("inquiries")
      .select("id, created_at")
      .is("deleted_at", null)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
    supabase
      .from("provider_profiles")
      .select("profile_id, created_at")
      .eq("featured", true)
      .eq("listing_status", "active")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString()),
  ])

  const totalParents = totalParentsRes.count ?? 0
  const totalProviders = totalProvidersRes.count ?? 0
  const totalReviews = totalReviewsRes.count ?? 0
  const totalInquiries = totalInquiriesRes.count ?? 0
  const totalFeatured = totalFeaturedRes.count ?? 0

  const parentsAgg = (parentsAggRes.data ?? []) as { created_at: string }[]
  const providersAgg = (providersAggRes.data ?? []) as { created_at: string }[]
  const reviewsAgg = (reviewsAggRes.data ?? []) as { created_at: string; rating: number | null }[]
  const inquiriesAgg = (inquiriesAggRes.data ?? []) as { created_at: string }[]
  const featuredAgg = (featuredAggRes.data ?? []) as { created_at: string }[]

  const bucketKey = (iso: string) => {
    const d = new Date(iso)
    if (bucket === "day") {
      return d.toISOString().slice(0, 10)
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
  }

  const growthMap = new Map<string, { parents: number; providers: number }>()
  parentsAgg.forEach((row) => {
    const key = bucketKey(row.created_at)
    const existing = growthMap.get(key) ?? { parents: 0, providers: 0 }
    existing.parents += 1
    growthMap.set(key, existing)
  })
  providersAgg.forEach((row) => {
    const key = bucketKey(row.created_at)
    const existing = growthMap.get(key) ?? { parents: 0, providers: 0 }
    existing.providers += 1
    growthMap.set(key, existing)
  })

  const growthBuckets = new Map<string, GrowthPoint>()
  for (const [key, value] of growthMap.entries()) {
    growthBuckets.set(key, {
      period: formatPeriodLabel(key, bucket),
      parents: value.parents,
      providers: value.providers,
    })
  }
  const growthData: GrowthPoint[] = fillTimeBuckets(
    growthBuckets,
    from,
    to,
    bucket,
    (key) => ({
      period: formatPeriodLabel(key, bucket),
      parents: 0,
      providers: 0,
    })
  )

  const reviewsMap = new Map<string, { count: number; ratingSum: number }>()
  reviewsAgg.forEach((row) => {
    const key = bucketKey(row.created_at)
    const existing = reviewsMap.get(key) ?? { count: 0, ratingSum: 0 }
    existing.count += 1
    if (typeof row.rating === "number") {
      existing.ratingSum += row.rating
    }
    reviewsMap.set(key, existing)
  })

  const reviewsBuckets = new Map<string, ReviewPoint>()
  for (const [key, value] of reviewsMap.entries()) {
    reviewsBuckets.set(key, {
      period: formatPeriodLabel(key, bucket),
      reviews: value.count,
      avgRating: value.count > 0 ? value.ratingSum / value.count : null,
    })
  }
  const reviewsData: ReviewPoint[] = fillTimeBuckets(
    reviewsBuckets,
    from,
    to,
    bucket,
    (key) => ({
      period: formatPeriodLabel(key, bucket),
      reviews: 0,
      avgRating: null,
    })
  )

  const inquiriesMap = new Map<string, number>()
  inquiriesAgg.forEach((row) => {
    const key = bucketKey(row.created_at)
    inquiriesMap.set(key, (inquiriesMap.get(key) ?? 0) + 1)
  })

  const inquiriesBuckets = new Map<string, InquiryPoint>()
  for (const [key, count] of inquiriesMap.entries()) {
    inquiriesBuckets.set(key, {
      period: formatPeriodLabel(key, bucket),
      inquiries: count,
    })
  }
  const inquiriesData: InquiryPoint[] = fillTimeBuckets(
    inquiriesBuckets,
    from,
    to,
    bucket,
    (key) => ({
      period: formatPeriodLabel(key, bucket),
      inquiries: 0,
    })
  )

  const featuredMap = new Map<string, number>()
  featuredAgg.forEach((row) => {
    const key = bucketKey(row.created_at)
    featuredMap.set(key, (featuredMap.get(key) ?? 0) + 1)
  })
  const featuredBuckets = new Map<string, FeaturedProviderPoint>()
  for (const [key, count] of featuredMap.entries()) {
    featuredBuckets.set(key, {
      period: formatPeriodLabel(key, bucket),
      featured: count,
    })
  }
  const featuredData: FeaturedProviderPoint[] = fillTimeBuckets(
    featuredBuckets,
    from,
    to,
    bucket,
    (key) => ({
      period: formatPeriodLabel(key, bucket),
      featured: 0,
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Platform-wide engagement and growth across parents, providers, reviews, and inquiries.
          </p>
        </div>
        <AdminAnalyticsDateRangeSelect value={range} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parents</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalParents.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              <span>Growing parent demand</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Providers</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalProviders.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              <span>Active providers on platform</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalReviews.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              <span>Parent feedback volume</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Featured Providers</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalFeatured.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              <span>Highlighted on platform</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inquiries</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalInquiries.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {inquiriesData.some((d) => d.inquiries > 0) ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span>High parent engagement</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>No recent inquiries in range</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminAnalyticsCharts
        growthData={growthData}
        reviewsData={reviewsData}
        inquiriesData={inquiriesData}
        featuredData={featuredData}
      />
    </div>
  )
}

