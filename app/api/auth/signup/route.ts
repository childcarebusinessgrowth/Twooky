import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type SignupPayload = {
  email?: string
  password?: string
  role?: "parent" | "provider"
  fullName?: string
  businessName?: string
  countryName?: string
  cityName?: string
}

function isValidRole(role: unknown): role is "parent" | "provider" {
  return role === "parent" || role === "provider"
}

function isMissingProfileLocationColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const code = "code" in error ? String(error.code ?? "") : ""
  const message = "message" in error ? String(error.message ?? "").toLowerCase() : ""

  return (
    (code === "42703" || code === "PGRST204") &&
    (message.includes("country_name") ||
      message.includes("city_name") ||
      message.includes("profiles.country_name") ||
      message.includes("profiles.city_name") ||
      message.includes("column"))
  )
}

async function rollbackUserIfNeeded(userId: string) {
  const admin = getSupabaseAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    console.error("Failed to rollback auth user after profile initialization error:", error)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupPayload
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const role = body.role
    const fullName = body.fullName?.trim()
    const businessName = body.businessName?.trim()
    const countryName = body.countryName?.trim()
    const cityName = body.cityName?.trim()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    if (!isValidRole(role)) {
      return NextResponse.json({ error: "Invalid account role." }, { status: 400 })
    }

    if (role === "parent") {
      if (!fullName) {
        return NextResponse.json({ error: "Full name is required for parent accounts." }, { status: 400 })
      }

      if (!countryName || !cityName) {
        return NextResponse.json(
          { error: "Location (country and city) is required for parent accounts." },
          { status: 400 },
        )
      }
    }

    if (role === "provider" && !businessName) {
      return NextResponse.json({ error: "Business name is required for provider accounts." }, { status: 400 })
    }

    const displayName = role === "provider" ? businessName : fullName

    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role,
        ...(role === "provider" ? { business_name: displayName, display_name: displayName } : {}),
      },
      user_metadata: {
        role,
        ...(role === "provider" ? { business_name: displayName, display_name: displayName } : {}),
        ...(role === "parent"
          ? {
              full_name: displayName,
              display_name: displayName,
              country_name: countryName,
              city_name: cityName,
            }
          : {}),
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userId = data.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 })
    }

    const profileUpsertPayload: Record<string, unknown> = {
      id: userId,
      email,
      role,
      display_name: displayName ?? email,
    }

    const profileUpsertPayloadWithLocation: Record<string, unknown> = {
      ...profileUpsertPayload,
      ...(role === "parent" ? { country_name: countryName, city_name: cityName } : {}),
    }

    const { error: profileError } = await admin
      .from("profiles" as never)
      .upsert(profileUpsertPayloadWithLocation as never, { onConflict: "id" })

    if (profileError && role === "parent" && isMissingProfileLocationColumnError(profileError)) {
      const { error: profileFallbackError } = await admin
        .from("profiles" as never)
        .upsert(profileUpsertPayload as never, { onConflict: "id" })

      if (profileFallbackError) {
        console.error("Profile initialization fallback failed:", profileFallbackError)
        await rollbackUserIfNeeded(userId)
        return NextResponse.json({ error: "Unable to initialize account profile." }, { status: 500 })
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (profileError) {
      console.error("Profile initialization failed:", profileError)
      await rollbackUserIfNeeded(userId)
      return NextResponse.json({ error: "Unable to initialize account profile." }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 })
  }
}
