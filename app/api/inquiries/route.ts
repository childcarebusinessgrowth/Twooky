import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderProfileIdBySlug } from "@/lib/parent-engagement"
import { resolveRoleForUser } from "@/lib/authz"

type CreateInquiryPayload = {
  providerSlug?: string
  subject?: string
  message?: string
  consentToContact?: boolean
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

    const providerProfileId = await getProviderProfileIdBySlug(
      supabase,
      providerSlug
    )
    if (!providerProfileId) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      )
    }

    const { data: inquiryId, error: rpcError } = await supabase.rpc(
      "create_inquiry",
      {
        p_provider_profile_id: providerProfileId,
        p_inquiry_subject: subject ?? "",
        p_message_plain: message,
        p_consent_to_contact: true,
      }
    )

    if (rpcError) {
      console.error("create_inquiry RPC error:", rpcError)
      return NextResponse.json(
        { error: rpcError.message ?? "Failed to create inquiry." },
        { status: 500 }
      )
    }

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
