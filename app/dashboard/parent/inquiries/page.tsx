import { RequireAuth } from "@/components/RequireAuth"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getInquiriesByParentProfileId,
  getInquiryIdByParentAndProvider,
  getProviderProfileIdBySlug,
} from "@/lib/parent-engagement"
import { ParentInquiriesClient } from "./ParentInquiriesClient"

type PageProps = {
  searchParams: Promise<{ provider?: string; open?: string; source?: string }>
}

export default async function ParentInquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const providerSlug = typeof params.provider === "string" ? params.provider.trim() : null
  const openId = typeof params.open === "string" ? params.open.trim() : null
  const composeSource =
    typeof params.source === "string" && params.source.trim() === "compare" ? "compare" : "directory"

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let inquiries: Awaited<ReturnType<typeof getInquiriesByParentProfileId>> = []
  let initialOpenId: string | null = openId
  let composeFor: { providerSlug: string; providerName: string } | null = null

  if (user) {
    inquiries = await getInquiriesByParentProfileId(supabase, user.id)

    if (providerSlug) {
      const providerProfileId = await getProviderProfileIdBySlug(supabase, providerSlug)
      if (providerProfileId) {
        const existingId = await getInquiryIdByParentAndProvider(
          supabase,
          user.id,
          providerProfileId
        )
        if (existingId) {
          initialOpenId = existingId
        } else {
          const { data: pp } = await supabase
            .from("provider_profiles")
            .select("business_name")
            .eq("provider_slug", providerSlug)
            .single()
          composeFor = {
            providerSlug,
            providerName: pp?.business_name ?? "Provider",
          }
        }
      }
    }
  }

  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            My inquiries
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            View and keep track of the messages you&apos;ve sent to childcare providers. Start a new
            conversation from any provider page with &quot;Send Inquiry&quot;.
          </p>
        </div>

        <ParentInquiriesClient
          inquiries={inquiries}
          initialOpenId={initialOpenId}
          composeFor={composeFor}
          composeSource={composeSource}
        />
      </div>
    </RequireAuth>
  )
}
