import { NextResponse } from "next/server"

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SITE_ROOT_DOMAIN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
] as const

const REQUIRED_SECRET_ENV = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
] as const

function hasValue(name: string): boolean {
  return typeof process.env[name] === "string" && process.env[name]!.trim().length > 0
}

export async function GET() {
  const missingPublicEnv = REQUIRED_PUBLIC_ENV.filter((name) => !hasValue(name))
  const missingSecretCount = REQUIRED_SECRET_ENV.filter((name) => !hasValue(name)).length
  const ready = missingPublicEnv.length === 0 && missingSecretCount === 0

  return NextResponse.json(
    {
      ok: ready,
      checks: {
        publicEnv: missingPublicEnv.length === 0 ? "pass" : "fail",
        secretEnv: missingSecretCount === 0 ? "pass" : "fail",
      },
      missingPublicEnv,
      missingSecretCount,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
