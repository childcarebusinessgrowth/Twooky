import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import {
  getInquiriesByProviderProfileId,
  getGuestInquiriesByProviderProfileId,
  getFavoriteLeadsByProviderProfileId,
} from "@/lib/parent-engagement"
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
  let inquiriesTitle = "Inquiries"
  let inquiriesDescription = "View messages from parents and new contact requests."
  let canUseCrmTools = false
  let canAccessFavoriteLeads = false

  if (user) {
    const access = await getProviderPlanAccessForUser(supabase, user.id)
    if (!access.canAccessInquiries) {
      redirect("/dashboard/provider/subscription")
    }

    canUseCrmTools = access.isThriveTier
    canAccessFavoriteLeads = access.canAccessFavoriteLeads
    inquiriesTitle = canUseCrmTools ? "Lead Management" : "Inquiries"
    inquiriesDescription = canUseCrmTools
      ? "View and manage leads from directory and compare tool."
      : "Reply to parent messages and review contact requests from the directory."

    const [inquiriesRes, guestRes, favoriteRes] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, access.providerProfileId),
      getGuestInquiriesByProviderProfileId(supabase, access.providerProfileId),
      access.canAccessFavoriteLeads
        ? getFavoriteLeadsByProviderProfileId(supabase, access.providerProfileId)
        : Promise.resolve([]),
    ])
    inquiries = inquiriesRes
    guestInquiries = guestRes
    favoriteLeads = favoriteRes
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{inquiriesTitle}</h1>
        <p className="text-muted-foreground">{inquiriesDescription}</p>
      </div>

      <ProviderInquiriesClient
        inquiries={inquiries}
        guestInquiries={guestInquiries}
        favoriteLeads={favoriteLeads}
        initialOpenId={openId}
        canUseCrmTools={canUseCrmTools}
        canAccessFavoriteLeads={canAccessFavoriteLeads}
      />
    </div>
  )
}
