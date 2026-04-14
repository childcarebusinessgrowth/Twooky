import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { parseConsentCookie } from "@/lib/cookie-consent"
import {
  formatUtcDateBucket,
  isLikelyVisitorToken,
  PROVIDER_PROFILE_VISITOR_COOKIE_MAX_AGE_SECONDS,
  PROVIDER_PROFILE_VISITOR_COOKIE_NAME,
} from "@/lib/providerProfileViews"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const consent = parseConsentCookie(request.headers.get("cookie"))
    if (consent?.analytics !== true) {
      return new NextResponse(null, { status: 204 })
    }

    const body = (await request.json()) as { slug?: string }
    const slug = typeof body.slug === "string" ? body.slug.trim() : ""
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 })
    }

    const cookieStore = await cookies()
    const existingToken = cookieStore.get(PROVIDER_PROFILE_VISITOR_COOKIE_NAME)?.value
    const visitorToken =
      isLikelyVisitorToken(existingToken) ? existingToken : crypto.randomUUID().replace(/-/g, "")

    if (!isLikelyVisitorToken(existingToken)) {
      cookieStore.set(PROVIDER_PROFILE_VISITOR_COOKIE_NAME, visitorToken, {
        path: "/",
        maxAge: PROVIDER_PROFILE_VISITOR_COOKIE_MAX_AGE_SECONDS,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    const supabase = getSupabaseAdminClient()
    const { data: profile, error: lookupError } = await supabase
      .from("provider_profiles")
      .select("profile_id, owner_profile_id")
      .ilike("provider_slug", slug)
      .maybeSingle()

    if (lookupError) {
      console.error("provider profile lookup error:", lookupError)
      return NextResponse.json({ error: "Failed to record view." }, { status: 500 })
    }

    if (!profile) {
      return new NextResponse(null, { status: 204 })
    }

    const userSupabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await userSupabase.auth.getUser()

    if (user && (user.id === profile.profile_id || user.id === profile.owner_profile_id)) {
      return new NextResponse(null, { status: 204 })
    }

    const { error: insertError } = await supabase
      .from("provider_profile_views")
      .upsert(
        {
          provider_profile_id: profile.profile_id,
          visitor_token: visitorToken,
          view_bucket: formatUtcDateBucket(),
        },
        {
          onConflict: "provider_profile_id,visitor_token,view_bucket",
          ignoreDuplicates: true,
        }
      )

    if (insertError) {
      const errDetail =
        typeof insertError === "object" && insertError !== null
          ? {
              message: (insertError as { message?: unknown }).message,
              code: (insertError as { code?: unknown }).code,
              details: (insertError as { details?: unknown }).details,
            }
          : insertError
      console.error("provider_profile_views insert error:", errDetail)
      try {
        console.error(
          "provider_profile_views insert error (serialized):",
          JSON.stringify(insertError, Object.getOwnPropertyNames(Object(insertError)))
        )
      } catch {
        // ignore serialization failure
      }
      const isDev = process.env.NODE_ENV === "development"
      return NextResponse.json(
        isDev
          ? { error: "Failed to record view.", code: (insertError as { code?: string }).code, message: (insertError as { message?: string }).message }
          : { error: "Failed to record view." },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error("Provider profile view API error:", e)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}
