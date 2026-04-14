import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { getFavoriteLeadsByProviderProfileId } from "@/lib/parent-engagement"

type RouteContext = { params: Promise<{ id: string }> }

const VALID_LEAD_STATUSES = ["new", "contacted", "tour_booked", "waitlist", "enrolled", "lost"] as const

type ValidLeadStatus = (typeof VALID_LEAD_STATUSES)[number]

function isValidLeadStatus(value: string): value is ValidLeadStatus {
  return VALID_LEAD_STATUSES.includes(value as ValidLeadStatus)
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!id?.trim()) {
      return NextResponse.json({ error: "Favorite lead ID is required." }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "provider" && resolution.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const rows = await getFavoriteLeadsByProviderProfileId(supabase, providerProfileId)
    const lead = rows.find((row) => row.id === id)
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (e) {
    console.error("Favorite lead GET API error:", e)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

type PatchPayload = { lead_status?: string }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!id?.trim()) {
      return NextResponse.json({ error: "Favorite lead ID is required." }, { status: 400 })
    }

    const body = (await request.json()) as PatchPayload
    const leadStatus = typeof body.lead_status === "string" ? body.lead_status.trim() : ""
    if (!isValidLeadStatus(leadStatus)) {
      return NextResponse.json({ error: "Invalid lead status." }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Forbidden. Only providers can update favorite leads." }, { status: 403 })
    }

    const { data, error } = await supabase.rpc("update_provider_favorite_lead_status", {
      p_favorite_id: id,
      p_lead_status: leadStatus,
    })

    if (error) {
      console.error("Favorite lead status update RPC error:", error)
      return NextResponse.json({ error: "Failed to update lead status." }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 })
    }

    return NextResponse.json({ ok: true, leadStatus })
  } catch (e) {
    console.error("Favorite lead PATCH API error:", e)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
