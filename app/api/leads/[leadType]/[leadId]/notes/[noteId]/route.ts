import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"

type RouteContext = {
  params: Promise<{ leadType: string; leadId: string; noteId: string }>
}

const VALID_LEAD_TYPES = ["inquiry", "guest-inquiry", "favorite"] as const

function isValidLeadType(value: string): value is (typeof VALID_LEAD_TYPES)[number] {
  return VALID_LEAD_TYPES.includes(value as (typeof VALID_LEAD_TYPES)[number])
}

function toDbLeadType(leadType: string): "inquiry" | "guest_inquiry" | "favorite" {
  if (leadType === "guest-inquiry") return "guest_inquiry"
  if (leadType === "favorite") return "favorite"
  return "inquiry"
}

/**
 * DELETE: Remove a note from a lead. Provider must own the lead and the note.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { leadType, leadId, noteId } = await context.params
    if (!isValidLeadType(leadType) || !leadId?.trim() || !noteId?.trim()) {
      return NextResponse.json({ error: "Invalid lead type, lead ID, or note ID." }, { status: 400 })
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
      return NextResponse.json({ error: "Forbidden. Only providers can delete notes." }, { status: 403 })
    }

    const dbLeadType = toDbLeadType(leadType)
    const { providerProfileId, canManageLeadNotes } = await getProviderPlanAccessForUser(supabase, user.id)
    if (!canManageLeadNotes) {
      return NextResponse.json({ error: "Lead notes are only available on Thrive and higher plans." }, { status: 403 })
    }

    if (dbLeadType === "inquiry") {
      const { data: inquiry } = await supabase
        .from("inquiries")
        .select("id")
        .eq("id", leadId)
        .eq("provider_profile_id", providerProfileId)
        .is("deleted_at", null)
        .maybeSingle()
      if (!inquiry) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 })
      }
    } else if (dbLeadType === "guest_inquiry") {
      const { data: guest } = await supabase
        .from("guest_inquiries")
        .select("id")
        .eq("id", leadId)
        .eq("provider_profile_id", providerProfileId)
        .maybeSingle()
      if (!guest) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 })
      }
    } else {
      const { data: favorite } = await supabase
        .from("parent_favorites")
        .select("id")
        .eq("id", leadId)
        .eq("provider_profile_id", providerProfileId)
        .maybeSingle()
      if (!favorite) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 })
      }
    }

    const { data: deleted, error } = await supabase
      .from("lead_notes")
      .delete()
      .eq("id", noteId)
      .eq("lead_id", leadId)
      .eq("lead_type", dbLeadType)
      .eq("provider_profile_id", providerProfileId)
      .select("id")
      .maybeSingle()

    if (error) {
      console.error("Lead note delete error:", error)
      return NextResponse.json({ error: "Failed to delete note." }, { status: 500 })
    }

    if (!deleted) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete lead note API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
