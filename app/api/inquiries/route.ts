import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getProviderPlanAccess } from "@/lib/provider-plan-access"
import { publicMessageForError } from "@/lib/publicErrors"
import { notifyProviderNewInquiry } from "@/lib/email/providerInquiryNotification"
import { buildInquiryNotification, insertProviderNotification } from "@/lib/providerNotifications"

type CreateInquiryPayload = {
  providerSlug?: string
  subject?: string
  message?: string
  consentToContact?: boolean
  source?: string
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
    if (resolution.role !== "parent") {
      return NextResponse.json(
        { error: "Only parents can create inquiries." },
        { status: 403 }
      )
    }

    const body = (await request.json()) as CreateInquiryPayload
    const providerSlug =
      typeof body.providerSlug === "string" ? body.providerSlug.trim() : ""
    const message =
      typeof body.message === "string" ? body.message.trim() : ""
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : null
    const consentToContact = body.consentToContact === true
    const source =
      typeof body.source === "string" && ["directory", "compare"].includes(body.source.trim())
        ? body.source.trim()
        : "directory"

    if (!providerSlug) {
      return NextResponse.json(
        { error: "Provider is required." },
        { status: 400 }
      )
    }
    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      )
    }
    if (!consentToContact) {
      return NextResponse.json(
        { error: "You must consent to data processing to send an inquiry." },
        { status: 400 }
      )
    }

    const { data: providerRow, error: providerLookupError } = await supabase
      .from("provider_profiles")
      .select("profile_id, plan_id, is_admin_managed, owner_profile_id")
      .ilike("provider_slug", providerSlug)
      .eq("listing_status", "active")
      .maybeSingle()

    if (providerLookupError) {
      console.error("Provider lookup error:", providerLookupError)
      return NextResponse.json(
        { error: publicMessageForError(providerLookupError, "Failed to create inquiry.") },
        { status: 500 }
      )
    }
    if (!providerRow) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      )
    }
    const isClaimed =
      typeof providerRow.owner_profile_id === "string" && providerRow.owner_profile_id.trim().length > 0
    if (!getProviderPlanAccess(providerRow.plan_id).canReceivePublicInquiries) {
      return NextResponse.json(
        { error: "Inquiries are not available for this provider." },
        { status: 403 }
      )
    }
    if (providerRow.is_admin_managed && !isClaimed) {
      return NextResponse.json(
        { error: "Inquiries are not available for this provider." },
        { status: 403 }
      )
    }

    const { data: inquiryId, error: rpcError } = await supabase.rpc(
      "create_inquiry",
      {
        p_provider_profile_id: providerRow.profile_id,
        p_inquiry_subject: subject ?? "",
        p_message_plain: message,
        p_consent_to_contact: true,
        p_source: source,
      }
    )

    if (rpcError) {
      console.error("create_inquiry RPC error:", rpcError)
      return NextResponse.json(
        { error: publicMessageForError(rpcError, "Failed to create inquiry.") },
        { status: 500 }
      )
    }

    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()

    const parentLabel = parentProfile?.display_name?.trim() || null

    void notifyProviderNewInquiry({
      providerProfileId: providerRow.profile_id,
      inquiryId: String(inquiryId),
      kind: "inquiry",
      fromName: parentLabel,
      source,
    })
    void insertProviderNotification(
      buildInquiryNotification({
        providerProfileId: providerRow.profile_id,
        inquiryId: String(inquiryId),
        fromName: parentLabel,
        subject,
      })
    )

    return NextResponse.json(
      { id: inquiryId, redirectUrl: `/dashboard/parent/inquiries?open=${inquiryId}` },
      { status: 201 }
    )
  } catch (e) {
    console.error("Create inquiry API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
