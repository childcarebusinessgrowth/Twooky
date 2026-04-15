import { NextResponse } from "next/server"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { deriveProviderSlug } from "@/lib/provider-slug"
import { resolveProviderLocation } from "@/lib/resolve-provider-city"

type SignupPayload = {
  email?: string
  password?: string
  role?: "parent" | "provider"
  fullName?: string
  businessName?: string
  phone?: string
  countryName?: string
  cityName?: string
  childAgeGroup?: string
  countryId?: string
  cityId?: string
  customCityName?: string
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

function toFriendlyAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes("already been registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered") ||
    lower.includes("email already")
  ) {
    return "This email is already in use. Please sign in or use a different email address."
  }
  if (
    lower.includes("password") &&
    (lower.includes("at least") || lower.includes("minimum") || lower.includes("too short") || lower.includes("6 characters"))
  ) {
    return "Please choose a stronger password. It must be at least 8 characters long."
  }
  if (lower.includes("invalid") && lower.includes("password")) {
    return "Please choose a stronger password. Use a mix of letters, numbers, and symbols."
  }
  return message
}

function toFriendlyProviderProfileError(error: unknown): string {
  if (!error || typeof error !== "object") return "We couldn't complete your registration. Please try again."
  const code = "code" in error ? String(error.code ?? "") : ""
  const message = "message" in error ? String(error.message ?? "").toLowerCase() : ""
  const details = "details" in error ? String((error as { details?: string }).details ?? "").toLowerCase() : ""

  if (code === "23505") {
    if (
      message.includes("provider_slug") ||
      details.includes("provider_slug") ||
      message.includes("provider_profiles_provider_slug")
    ) {
      return "This business name is already taken. Please choose a different one."
    }
  }
  return "We couldn't complete your registration. Please try again."
}

async function rollbackUserIfNeeded(userId: string) {
  const admin = getSupabaseAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    console.error("Failed to rollback auth user after profile initialization error:", error)
  }
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request)
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "signup",
    limit: 5,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const body = (await request.json()) as SignupPayload
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const role = body.role
    const fullName = body.fullName?.trim()
    const businessName = body.businessName?.trim()
    const phone = body.phone?.trim()
    const countryName = body.countryName?.trim()
    const cityName = body.cityName?.trim()
    const childAgeGroup = body.childAgeGroup?.trim()

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

      if (!childAgeGroup) {
        return NextResponse.json(
          { error: "Child age group is required for parent accounts." },
          { status: 400 },
        )
      }
    }

    if (role === "provider" && !businessName) {
      return NextResponse.json({ error: "Business name is required for provider accounts." }, { status: 400 })
    }

    const countryId = body.countryId?.trim()
    const cityId = body.cityId?.trim()
    const customCityName = body.customCityName?.trim()

    if (role === "provider") {
      if (!countryId) {
        return NextResponse.json(
          { error: "Please select a country." },
          { status: 400 },
        )
      }
      if (!cityId && !customCityName) {
        return NextResponse.json(
          { error: "Please select a city or enter your city name." },
          { status: 400 },
        )
      }
    }

    const displayName = role === "provider" ? businessName : fullName

    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role,
        ...(role === "provider"
          ? { business_name: displayName, display_name: displayName, ...(phone ? { phone } : {}) }
          : {}),
      },
      user_metadata: {
        role,
        ...(role === "provider"
          ? { business_name: displayName, display_name: displayName, ...(phone ? { phone } : {}) }
          : {}),
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
      const friendlyMessage = toFriendlyAuthError(error.message)
      return NextResponse.json({ error: friendlyMessage }, { status: 400 })
    }

    const userId = data.user?.id
    if (!userId) {
      return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 })
    }

    let resolvedProviderLocation: {
      countryId: string
      cityId: string
      countryName: string
      cityName: string
    } | null = null

    if (role === "provider" && countryId) {
      try {
        resolvedProviderLocation = await resolveProviderLocation(admin, {
          countryId,
          cityId: cityId || undefined,
          customCityName: customCityName || undefined,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid location."
        await rollbackUserIfNeeded(userId)
        return NextResponse.json({ error: message }, { status: 400 })
      }
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
      ...(role === "provider" && resolvedProviderLocation
        ? {
            country_name: resolvedProviderLocation.countryName,
            city_name: resolvedProviderLocation.cityName,
          }
        : {}),
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

      // Even if location columns are missing on profiles, still attempt to initialize parent profile extension.
      if (role === "parent") {
        const { error: parentProfileError } = await admin
          .from("parent_profiles" as never)
          .upsert(
            {
              profile_id: userId,
              child_age_group: childAgeGroup,
            } as never,
            { onConflict: "profile_id" },
          )

        if (parentProfileError) {
          console.error("Parent profile initialization failed (fallback path):", parentProfileError)
          await rollbackUserIfNeeded(userId)
          return NextResponse.json({ error: "Unable to initialize account profile." }, { status: 500 })
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (profileError) {
      console.error("Profile initialization failed:", profileError)
      await rollbackUserIfNeeded(userId)
      return NextResponse.json({ error: "Unable to initialize account profile." }, { status: 500 })
    }

    if (role === "parent") {
      const { error: parentProfileError } = await admin
        .from("parent_profiles" as never)
        .upsert(
          {
            profile_id: userId,
            child_age_group: childAgeGroup,
          } as never,
          { onConflict: "profile_id" },
        )

      if (parentProfileError) {
        console.error("Parent profile initialization failed:", parentProfileError)
        await rollbackUserIfNeeded(userId)
        return NextResponse.json({ error: "Unable to initialize account profile." }, { status: 500 })
      }
    }

    if (role === "provider" && businessName) {
      const providerSlug = deriveProviderSlug(businessName)
      const { error: providerProfileError } = await admin.from("provider_profiles" as never).upsert(
        {
          profile_id: userId,
          plan_id: "sprout",
          listing_status: "draft",
          provider_slug: providerSlug || null,
          business_name: businessName,
          phone: phone || null,
          ...(resolvedProviderLocation
            ? {
                country_id: resolvedProviderLocation.countryId,
                city_id: resolvedProviderLocation.cityId,
                city: resolvedProviderLocation.cityName,
              }
            : {}),
        } as never,
        { onConflict: "profile_id" },
      )
      if (providerProfileError) {
        console.error("Provider profile initialization failed:", providerProfileError)
        await rollbackUserIfNeeded(userId)
        const friendlyMessage = toFriendlyProviderProfileError(providerProfileError)
        return NextResponse.json({ error: friendlyMessage }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 500 })
  }
}
