import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"

type RouteContext = { params: Promise<{ leadType: string; leadId: string }> }

const VALID_LEAD_TYPES = ["inquiry", "guest-inquiry"] as const

function isValidLeadType(value: string): value is (typeof VALID_LEAD_TYPES)[number] {
  return VALID_LEAD_TYPES.includes(value as (typeof VALID_LEAD_TYPES)[number])
}

function toDbLeadType(leadType: string): "inquiry" | "guest_inquiry" {
  return leadType === "guest-inquiry" ? "guest_inquiry" : "inquiry"
}

/**
 * GET: List notes for a lead. Provider must own the lead.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { leadType, leadId } = await context.params
    if (!isValidLeadType(leadType) || !leadId?.trim()) {
      return NextResponse.json({ error: "Invalid lead type or ID." }, { status: 400 })
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
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const dbLeadType = toDbLeadType(leadType)

    // Verify provider owns this lead
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

    const { data: notes, error } = await supabase
      .from("lead_notes")
      .select("id, note_text, created_at, created_by")
      .eq("lead_type", dbLeadType)
      .eq("lead_id", leadId)
      .eq("provider_profile_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Lead notes fetch error:", error)
      return NextResponse.json({ error: "Failed to load notes." }, { status: 500 })
    }

    return NextResponse.json({
      notes: (notes ?? []).map((n) => ({
        id: n.id,
        noteText: n.note_text,
        createdAt: n.created_at,
        createdBy: n.created_by,
      })),
    })
  } catch (e) {
    console.error("Get lead notes API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

type PostPayload = { noteText?: string }

/**
 * POST: Add a note to a lead. Provider must own the lead.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { leadType, leadId } = await context.params
    if (!isValidLeadType(leadType) || !leadId?.trim()) {
      return NextResponse.json({ error: "Invalid lead type or ID." }, { status: 400 })
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
      return NextResponse.json({ error: "Forbidden. Only providers can add notes." }, { status: 403 })
    }

    const body = (await request.json()) as PostPayload
    const noteText = typeof body.noteText === "string" ? body.noteText.trim() : ""
    if (!noteText) {
      return NextResponse.json({ error: "Note text is required." }, { status: 400 })
    }

    const dbLeadType = toDbLeadType(leadType)

    // Verify provider owns this lead
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

    const { data: note, error } = await supabase
      .from("lead_notes")
      .insert({
        lead_id: leadId,
        lead_type: dbLeadType,
        provider_profile_id: user.id,
        note_text: noteText,
        created_by: user.id,
      })
      .select("id, note_text, created_at")
      .single()

    if (error) {
      console.error("Lead note insert error:", error)
      return NextResponse.json({ error: "Failed to add note." }, { status: 500 })
    }

    return NextResponse.json(
      {
        id: note.id,
        noteText: note.note_text,
        createdAt: note.created_at,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error("Add lead note API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
