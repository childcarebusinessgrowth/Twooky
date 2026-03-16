import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getReviewsByProviderProfileId } from "@/lib/parent-engagement"
import { ProviderReviewsContent } from "./ProviderReviewsContent"

export default async function ProviderReviewsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const reviews = user
    ? await getReviewsByProviderProfileId(supabase, user.id)
    : []

  return (
    <ProviderReviewsContent
      providerProfileId={user?.id ?? ""}
      reviews={reviews}
    />
  )
}
