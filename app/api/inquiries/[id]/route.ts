import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET inquiry metadata (for thread header). Only returns if current user is participant.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: inquiryId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: metaRows, error: metaError } = await supabase.rpc("get_inquiry_meta_secure", {
      p_inquiry_id: inquiryId,
    })

    const inquiry = metaRows?.[0]
    if (metaError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 })
    }

    return NextResponse.json({
      id: inquiry.id,
      inquirySubject: inquiry.inquiry_subject ?? null,
      providerBusinessName: inquiry.provider_business_name ?? null,
      providerSlug: inquiry.provider_slug ?? null,
      parentDisplayName: inquiry.parent_display_name ?? null,
      parentEmail: inquiry.parent_email ?? null,
      createdAt: inquiry.created_at,
      updatedAt: inquiry.updated_at,
      leadStatus: inquiry.lead_status ?? "new",
    })
  } catch (e) {
    console.error("Get inquiry API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "tour_booked",
  "waitlist",
  "enrolled",
  "lost",
] as const

/**
 * PATCH: Update inquiry lead status (provider only).
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: inquiryId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const leadStatus =
      typeof body.lead_status === "string" ? body.lead_status.trim().toLowerCase() : null
    if (
      !leadStatus ||
      !LEAD_STATUS_VALUES.includes(leadStatus as (typeof LEAD_STATUS_VALUES)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid lead status. Use new, contacted, tour_booked, waitlist, enrolled, or lost." },
        { status: 400 }
      )
    }

    const { data: inquiry, error: fetchError } = await supabase
      .from("inquiries")
      .select("id, provider_profile_id")
      .eq("id", inquiryId)
      .is("deleted_at", null)
      .single()

    if (fetchError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 })
    }

    if (inquiry.provider_profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the provider can set lead status." },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ lead_status: leadStatus })
      .eq("id", inquiryId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update lead status." }, { status: 500 })
    }

    return NextResponse.json({ leadStatus })
  } catch (e) {
    console.error("Patch inquiry lead status API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
