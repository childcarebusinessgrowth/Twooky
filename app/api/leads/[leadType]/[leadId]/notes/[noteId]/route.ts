import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"

type RouteContext = {
  params: Promise<{ leadType: string; leadId: string; noteId: string }>
}

const VALID_LEAD_TYPES = ["inquiry", "guest-inquiry"] as const

function isValidLeadType(value: string): value is (typeof VALID_LEAD_TYPES)[number] {
  return VALID_LEAD_TYPES.includes(value as (typeof VALID_LEAD_TYPES)[number])
}

function toDbLeadType(leadType: string): "inquiry" | "guest_inquiry" {
  return leadType === "guest-inquiry" ? "guest_inquiry" : "inquiry"
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

    if (dbLeadType === "inquiry") {
      const { data: inquiry } = await supabase
        .from("inquiries")
        .select("id")
        .eq("id", leadId)
        .eq("provider_profile_id", user.id)
        .is("deleted_at", null)
        .maybeSingle()
      if (!inquiry) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 })
      }
    } else {
      const { data: guest } = await supabase
        .from("guest_inquiries")
        .select("id")
        .eq("id", leadId)
        .eq("provider_profile_id", user.id)
        .maybeSingle()
      if (!guest) {
        return NextResponse.json({ error: "Lead not found." }, { status: 404 })
      }
    }

    const { data: deleted, error } = await supabase
      .from("lead_notes")
      .delete()
      .eq("id", noteId)
      .eq("lead_id", leadId)
      .eq("lead_type", dbLeadType)
      .eq("provider_profile_id", user.id)
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
