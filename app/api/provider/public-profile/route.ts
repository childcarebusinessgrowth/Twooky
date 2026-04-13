import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

export async function GET() {
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

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)

    const { data: profile, error: profileError } = await supabase
      .from("provider_profiles")
      .select("provider_slug")
      .eq("profile_id", providerProfileId)
      .maybeSingle()

    if (profileError) {
      console.error("Provider public profile lookup error:", profileError)
      return NextResponse.json({ error: "Failed to load provider profile." }, { status: 500 })
    }

    const slug = profile?.provider_slug?.trim() ?? ""
    if (!slug) {
      return NextResponse.json({ href: null })
    }

    return NextResponse.json({ href: `/providers/${slug}` })
  } catch (e) {
    console.error("Provider public profile API error:", e)
    return NextResponse.json({ error: "Failed to load provider profile." }, { status: 500 })
  }
}
