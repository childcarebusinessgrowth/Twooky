import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import { getReviewsByProviderProfileId } from "@/lib/parent-engagement"
import { ProviderReviewsContent } from "./ProviderReviewsContent"

export default async function ProviderReviewsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let providerProfileId = ""
  if (user) {
    const access = await getProviderPlanAccessForUser(supabase, user.id)
    if (!access.canAccessReviews) {
      redirect("/dashboard/provider/subscription")
    }
    providerProfileId = access.providerProfileId
  }
  const admin = getSupabaseAdminClient()
  const reviews = providerProfileId
    ? await getReviewsByProviderProfileId(admin, providerProfileId)
    : []

  return (
    <ProviderReviewsContent
      providerProfileId={providerProfileId}
      reporterProfileId={user?.id ?? ""}
      reviews={reviews}
    />
  )
}
