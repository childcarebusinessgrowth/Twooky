import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderAnalytics, type DateRangeKey } from "@/lib/provider-analytics"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import { AnalyticsCharts } from "./AnalyticsCharts"

export const dynamic = "force-dynamic"

const VALID_RANGES: DateRangeKey[] = ["7days", "30days", "3months", "12months"]

function parseRange(value: string | undefined): DateRangeKey {
  if (value && VALID_RANGES.includes(value as DateRangeKey)) return value as DateRangeKey
  return "12months"
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const params = await searchParams
  const range = parseRange(params?.range)

  if (!user) {
    return (
      <Suspense fallback={<div className="animate-pulse rounded-lg h-8 bg-muted w-48" />}>
        <AnalyticsCharts
          key={range}
          data={{
            viewsByMonth: [],
            micrositeTrafficByMonth: [],
            inquiriesByMonth: [],
            reviewsByMonth: [],
            micrositeVisitsTotal: 0,
            micrositeUniqueVisitorsTotal: 0,
            conversionRatePercent: null,
            avgResponseTimeHours: null,
            searchRank: null,
            searchRankAreaLabel: "your area",
          }}
          currentRange={range}
        />
      </Suspense>
    )
  }

  const { providerProfileId, canAccessAnalytics } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessAnalytics) {
    redirect("/dashboard/provider/subscription")
  }
  const data = await getProviderAnalytics(supabase, providerProfileId, range)
  return (
    <Suspense fallback={<div className="animate-pulse rounded-lg h-8 bg-muted w-48" />}>
      <AnalyticsCharts key={range} data={data} currentRange={range} />
    </Suspense>
  )
}
