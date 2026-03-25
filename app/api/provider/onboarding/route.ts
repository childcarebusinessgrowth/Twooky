import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { publicMessageForError } from "@/lib/publicErrors"

/**
 * GET: Check if provider is "new" (has not seen the onboarding tour).
 * Returns { isNewProvider: boolean }.
 */
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

    const { data: profile, error } = await supabase
      .from("provider_profiles")
      .select("onboarding_tour_shown_at, listing_status")
      .eq("profile_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Provider onboarding status query error:", error)
      return NextResponse.json({ error: publicMessageForError(error, "Unable to check onboarding status") }, { status: 500 })
    }

    const isNewProvider =
      profile != null &&
      profile.onboarding_tour_shown_at == null &&
      (profile.listing_status === "draft" || profile.listing_status == null)

    return NextResponse.json({ isNewProvider: !!isNewProvider })
  } catch (e) {
    console.error("Provider onboarding status API error:", e)
    return NextResponse.json({ error: publicMessageForError(e, "Unable to check onboarding status") }, { status: 500 })
  }
}

/**
 * PATCH: Mark the onboarding tour as shown.
 */
export async function PATCH() {
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

    const { error } = await supabase
      .from("provider_profiles")
      .update({ onboarding_tour_shown_at: new Date().toISOString() })
      .eq("profile_id", user.id)

    if (error) {
      console.error("Provider onboarding status update error:", error)
      return NextResponse.json({ error: publicMessageForError(error, "Unable to update onboarding status") }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Provider onboarding update API error:", e)
    return NextResponse.json({ error: publicMessageForError(e, "Unable to update onboarding status") }, { status: 500 })
  }
}
