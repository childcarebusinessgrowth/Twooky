import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

export const dynamic = "force-dynamic"

const VALID_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const

function isValidOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (VALID_TYPES as readonly string[]).includes(value)
}

function resolveNextPath(raw: string | null): string {
  if (!raw) return "/update-password"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/update-password"
  return raw
}

/**
 * Verifies a Supabase email OTP on the server using the `token_hash` from `generateLink`.
 * Using our own route (instead of Supabase's `/auth/v1/verify?token=...`) means email
 * scanners / link previews that prefetch the URL cannot present a used token to the user
 * at submit time. The worst case is a graceful redirect to `/update-password?error=invalid`.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const typeParam = url.searchParams.get("type")
  const next = resolveNextPath(url.searchParams.get("next"))

  if (!tokenHash || !isValidOtpType(typeParam)) {
    return NextResponse.redirect(new URL("/update-password?error=invalid", url.origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({
    type: typeParam,
    token_hash: tokenHash,
  })

  if (error) {
    return NextResponse.redirect(new URL("/update-password?error=invalid", url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
