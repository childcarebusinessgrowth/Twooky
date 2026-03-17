import { loadAdminReviews } from "@/lib/admin-dashboard"
import { AdminReviewsClient } from "./AdminReviewsClient"

export default async function AdminReviewsPage() {
  const { reviews, error } = await loadAdminReviews()

  return (
    <AdminReviewsClient
      initialReviews={reviews}
      loadError={error}
    />
  )
}
