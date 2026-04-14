import { PLAN_IDS, PRICING_PLANS, type PlanId } from "@/lib/pricing-data"
import {
  getAdminProviderPlans,
  type ProviderPlanFilter,
} from "./actions"
import { AdminProviderPlansPageClient } from "./pageClient"

const PAGE_SIZE = 20

function isProviderPlanFilter(value: string | null | undefined): value is ProviderPlanFilter {
  return value === "all" || PLAN_IDS.includes(value as PlanId)
}

type PageProps = {
  searchParams: Promise<{
    page?: string
    search?: string
    plan?: string
  }>
}

export default async function AdminProviderPlansPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)
  const searchQuery = params.search?.trim() ?? ""
  const planFilter: ProviderPlanFilter = isProviderPlanFilter(params.plan) ? params.plan : "all"

  const result = await getAdminProviderPlans({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery || undefined,
    plan: planFilter,
  })

  return (
    <AdminProviderPlansPageClient
      rows={result.rows}
      total={result.total}
      page={page}
      pageSize={PAGE_SIZE}
      searchQuery={searchQuery}
      planFilter={planFilter}
      plans={PRICING_PLANS.map((plan) => ({ id: plan.id, name: plan.name }))}
    />
  )
}
