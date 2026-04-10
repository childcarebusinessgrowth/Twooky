"use server"

import { revalidatePath } from "next/cache"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { assertServerRole } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const PROVIDER_REVIEWS_PATH = "/dashboard/provider/reviews"
const ADMIN_REVIEWS_PATH = "/admin/reviews"

/**
 * Remove the review after a provider report was upheld. Deletes the review (cascades reports)
 * and notifies the provider.
 */
export async function acceptReviewReportAndDeleteReview(reviewId: string): Promise<{ error?: string }> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { data: review, error: fetchError } = await supabase
    .from("parent_reviews")
    .select("id, provider_profile_id, review_text")
    .eq("id", reviewId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!review) return { error: "Review not found." }

  const { data: providerRow } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", review.provider_profile_id)
    .maybeSingle()

  const { error: delError } = await supabase.from("parent_reviews").delete().eq("id", reviewId)
  if (delError) return { error: delError.message }

  const snippet = review.review_text.trim().slice(0, 80)
  await supabase.from("provider_notifications").insert({
    provider_profile_id: review.provider_profile_id,
    type: "review_report_accepted",
    title: "Report accepted , review removed",
    message:
      "We reviewed your report and removed the reported review from the directory." +
      (snippet ? ` Removed: "${snippet}${review.review_text.length > 80 ? "…" : ""}"` : ""),
    href: PROVIDER_REVIEWS_PATH,
  })

  revalidatePath(ADMIN_REVIEWS_PATH)
  revalidatePath(PROVIDER_REVIEWS_PATH)
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (providerRow?.provider_slug) {
    revalidatePath(`/providers/${providerRow.provider_slug}`)
  }
  return {}
}

/**
 * Dismiss a report without removing the review.
 */
export async function dismissReviewReport(reportId: string): Promise<{ error?: string }> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("review_reports").delete().eq("id", reportId)
  if (error) return { error: error.message }

  revalidatePath(ADMIN_REVIEWS_PATH)
  return {}
}
