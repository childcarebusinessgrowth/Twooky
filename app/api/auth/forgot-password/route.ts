import { NextResponse } from "next/server"
import { getSiteOrigin } from "@/lib/email/brand"
import { sendPasswordResetEmail } from "@/lib/email/passwordReset"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type Body = {
  email?: string
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const GENERIC_SUCCESS_MESSAGE = "If an account exists for this email, a reset link has been sent."

export async function POST(request: Request) {
  let email = ""
  try {
    const body = (await request.json()) as Body
    email = typeof body.email === "string" ? body.email.trim() : ""
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const redirectTo = `${getSiteOrigin().replace(/\/$/, "")}/update-password`

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      if (error) {
        console.warn("[auth] Password reset generateLink:", error.message)
      }
      return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE })
    }

    const actionLink = data.properties.action_link
    const sendResult = await sendPasswordResetEmail(email, actionLink)

    if (!sendResult.ok) {
      console.error("[auth] Password reset email could not be sent", { reason: sendResult.reason })
      return NextResponse.json(
        { error: "Unable to send reset email right now. Please try again later." },
        { status: 503 },
      )
    }

    return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE })
  } catch (e) {
    console.error("[auth] forgot-password route error:", e)
    return NextResponse.json(
      { error: "Unable to process your request right now. Please try again later." },
      { status: 500 },
    )
  }
}
