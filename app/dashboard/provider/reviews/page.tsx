import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getReviewsByProviderProfileId } from "@/lib/parent-engagement"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { ProviderReviewsContent } from "./ProviderReviewsContent"

export default async function ProviderReviewsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const providerProfileId = user
    ? await resolveOwnedProviderProfileId(supabase, user.id)
    : ""
  const reviews = providerProfileId
    ? await getReviewsByProviderProfileId(supabase, providerProfileId)
    : []

  return (
    <ProviderReviewsContent
      providerProfileId={providerProfileId}
      reporterProfileId={user?.id ?? ""}
      reviews={reviews}
    />
  )
}
