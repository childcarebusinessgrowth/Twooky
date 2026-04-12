import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AdminSocialProofClient } from "./pageClient"
import type { SocialProofType } from "./actions"

export const dynamic = "force-dynamic"

export type SocialProofRow = {
  id: string
  provider_profile_id: string
  type: SocialProofType
  content: string
  rating: number | null
  image_url: string | null
  video_url: string | null
  author_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type ProviderMeta = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
}

export default async function AdminSocialProofPage() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("social_proofs" as never)
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/social-proof] social_proofs", error.message)
  }

  const rows = (data ?? []) as SocialProofRow[]
  const providerIds = [...new Set(rows.map((row) => row.provider_profile_id))]
  let providerMap: Record<string, ProviderMeta> = {}

  if (providerIds.length > 0) {
    const { data: providers, error: providersError } = await supabase
      .from("provider_profiles")
      .select("profile_id, provider_slug, business_name, city")
      .in("profile_id", providerIds)

    if (providersError) {
      console.error("[admin/social-proof] provider_profiles", providersError.message)
    } else {
      providerMap = Object.fromEntries((providers ?? []).map((provider) => [provider.profile_id, provider as ProviderMeta]))
    }
  }

  return <AdminSocialProofClient initialRows={rows} providerMap={providerMap} />
}
