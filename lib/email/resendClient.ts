import "server-only"
import { Resend } from "resend"

let resend: Resend | null = null

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  if (!resend) resend = new Resend(key)
  return resend
}

export function getResendFromAddress(): string {
  const raw = process.env.RESEND_FROM?.trim()
  if (!raw) return "Twooky <onboarding@resend.dev>"
  if (raw.includes("<") && raw.includes(">")) return raw
  return `Twooky <${raw}>`
}

/** Logs Resend API errors and hints when the sender domain is not verified. */
export function logResendSendError(context: string, error: unknown): void {
  console.error(`[email] Resend send failed (${context}):`, error)
  const e = error as { message?: string; statusCode?: number; name?: string }
  const msg = typeof e?.message === "string" ? e.message : ""
  if (
    e?.statusCode === 403 &&
    (msg.includes("domain") || msg.includes("verified") || msg.includes("not verified"))
  ) {
    console.warn(
      "[email] Sender domain rejected by Resend. Verify twooky.com at https://resend.com/domains (DNS), " +
        "or until then set RESEND_FROM=onboarding@resend.dev for testing (Resend allows this without your domain).",
    )
  }
}
