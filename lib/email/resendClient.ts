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
  return process.env.RESEND_FROM?.trim() || "Twooky <notification@twooky.com>"
}
