import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"

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

    const meta = inquiry as { source?: string | null }
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
      source: meta.source ?? null,
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

    const { providerProfileId, canManageInquiryStatuses } = await getProviderPlanAccessForUser(supabase, user.id)
    if (!canManageInquiryStatuses) {
      return NextResponse.json(
        { error: "Lead statuses are only available on Thrive and higher plans." },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ lead_status: leadStatus })
      .eq("id", inquiryId)
      .eq("provider_profile_id", providerProfileId)

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
