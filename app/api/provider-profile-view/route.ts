import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string }
    const slug = typeof body.slug === "string" ? body.slug.trim() : ""
    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: profile, error: lookupError } = await supabase
      .from("provider_profiles")
      .select("profile_id")
      .ilike("provider_slug", slug)
      .maybeSingle()

    if (lookupError || !profile) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 })
    }

    const { error: insertError } = await supabase.from("provider_profile_views").insert({
      provider_profile_id: profile.profile_id,
    })

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
