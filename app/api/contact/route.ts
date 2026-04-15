import { NextResponse } from "next/server"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const CONSENT_VERSION = "2025-03-15"

type ContactPayload = {
  name?: string
  email?: string
  phone?: string
  message?: string
  consentChecked?: boolean
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "contact",
    limit: 5,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const body = (await request.json()) as ContactPayload
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : null
    const message = typeof body.message === "string" ? body.message.trim() : ""
    const consentChecked = body.consentChecked === true

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }
    if (!consentChecked) {
      return NextResponse.json(
        { error: "You must consent to data processing to submit" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        message,
        consent_to_contact: true,
        consent_version: CONSENT_VERSION,
        consented_at: new Date().toISOString(),
      })
      .select("id, created_at")
      .single()

    if (error) {
      console.error("Contact form insert error:", error)
      return NextResponse.json(
        { error: "Failed to save your message. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, id: data.id, created_at: data.created_at },
      { status: 201 }
    )
  } catch (e) {
    console.error("Contact API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
