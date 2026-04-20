import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { enrichProviderGooglePlaceCache } from "@/lib/google-place-enrichment"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

type EnrichGoogleCacheBody = {
  businessName?: string
  address?: string
  placeId?: string | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as EnrichGoogleCacheBody
    const admin = getSupabaseAdminClient()
    const providerProfileId = await resolveOwnedProviderProfileId(admin, user.id)

    const { count } = await admin
      .from("provider_photos")
      .select("id", { head: true, count: "exact" })
      .eq("provider_profile_id", providerProfileId)
      .eq("is_primary", true)

    const result = await enrichProviderGooglePlaceCache({
      providerProfileId,
      businessName: body.businessName ?? "",
      address: body.address ?? "",
      placeId: body.placeId ?? null,
      hasPrimaryPhoto: (count ?? 0) > 0,
      logContext: "provider-self-serve-enrichment",
    })

    return NextResponse.json({
      ok: result.ok,
      placeId: result.placeId,
    })
  } catch {
    return NextResponse.json({ ok: false, placeId: null })
  }
}
