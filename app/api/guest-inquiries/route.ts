import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type GuestInquiryPayload = {
  providerSlug?: string
  childDob?: string
  idealStartDate?: string
  message?: string
  firstName?: string
  lastName?: string
  email?: string
  telephone?: string
  consentToContact?: boolean
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GuestInquiryPayload
    const providerSlug = typeof body.providerSlug === "string" ? body.providerSlug.trim() : ""
    const childDob = typeof body.childDob === "string" ? body.childDob.trim() : ""
    const idealStartDate = typeof body.idealStartDate === "string" ? body.idealStartDate.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const telephone = typeof body.telephone === "string" ? body.telephone.trim() : ""
    const consentToContact = body.consentToContact === true

    if (!providerSlug) {
      return NextResponse.json({ error: "Provider is required." }, { status: 400 })
    }
    if (!childDob) {
      return NextResponse.json({ error: "Date of birth is required." }, { status: 400 })
    }
    if (!idealStartDate) {
      return NextResponse.json({ error: "Ideal start date is required." }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: "Message or days/sessions required." }, { status: 400 })
    }
    if (!firstName) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 })
    }
    if (!lastName) {
      return NextResponse.json({ error: "Last name is required." }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }
    if (!telephone) {
      return NextResponse.json({ error: "Telephone is required." }, { status: 400 })
    }
    if (!consentToContact) {
      return NextResponse.json(
        { error: "You must consent to data processing to submit." },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const { data: id, error: rpcError } = await supabase.rpc("create_guest_inquiry", {
      p_provider_slug: providerSlug,
      p_child_dob: childDob,
      p_ideal_start_date: idealStartDate,
      p_message_plain: message,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email,
      p_telephone: telephone,
      p_consent_to_contact: true,
    })

    if (rpcError) {
      console.error("create_guest_inquiry RPC error:", rpcError)
      return NextResponse.json(
        { error: rpcError.message ?? "Failed to submit inquiry. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    console.error("Guest inquiry API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
