import { loadAdminReviewReports, loadAdminReviews } from "@/lib/admin-dashboard"
import { AdminReviewsClient } from "./AdminReviewsClient"

type AdminReviewsPageProps = {
  searchParams: Promise<{ reports?: string }>
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const [{ reviews, error }, { reports, error: reportsError }, params] = await Promise.all([
    loadAdminReviews(),
    loadAdminReviewReports(),
    searchParams,
  ])
  const defaultTab = params.reports === "1" ? "reports" : "all"

  return (
    <AdminReviewsClient
      initialReviews={reviews}
      initialReports={reports}
      loadError={error}
      reportsLoadError={reportsError}
      defaultTab={defaultTab}
    />
  )
}
