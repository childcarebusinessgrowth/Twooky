import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getInquiriesByProviderProfileId,
  getGuestInquiriesByProviderProfileId,
  getFavoriteLeadsByProviderProfileId,
} from "@/lib/parent-engagement"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { ProviderInquiriesClient } from "./ProviderInquiriesClient"

type PageProps = {
  searchParams: Promise<{ open?: string }>
}

export default async function ProviderInquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const openId = typeof params.open === "string" ? params.open.trim() : null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let inquiries: Awaited<ReturnType<typeof getInquiriesByProviderProfileId>> = []
  let guestInquiries: Awaited<ReturnType<typeof getGuestInquiriesByProviderProfileId>> = []
  let favoriteLeads: Awaited<ReturnType<typeof getFavoriteLeadsByProviderProfileId>> = []

  if (user) {
    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const [inquiriesRes, guestRes, favoriteRes] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, providerProfileId),
      getGuestInquiriesByProviderProfileId(supabase, providerProfileId),
      getFavoriteLeadsByProviderProfileId(supabase, providerProfileId),
    ])
    inquiries = inquiriesRes
    guestInquiries = guestRes
    favoriteLeads = favoriteRes
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground">View and manage leads from directory and compare tool</p>
      </div>

      <ProviderInquiriesClient
        inquiries={inquiries}
        guestInquiries={guestInquiries}
        favoriteLeads={favoriteLeads}
        initialOpenId={openId}
      />
    </div>
  )
}
