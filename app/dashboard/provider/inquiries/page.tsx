import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getInquiriesByProviderProfileId,
  getGuestInquiriesByProviderProfileId,
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

  if (user) {
    const [inquiriesRes, guestRes] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, user.id),
      getGuestInquiriesByProviderProfileId(supabase, user.id),
    ])
    inquiries = inquiriesRes
    guestInquiries = guestRes
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
        initialOpenId={openId}
      />
    </div>
  )
}
