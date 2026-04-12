import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type SocialProofApiItem = {
  id: string
  type: "text" | "image" | "video"
  content: string
  rating: number | null
  imageUrl: string | null
  videoUrl: string | null
  authorName: string | null
}

type SocialProofApiResponse = {
  providerId: string
  providerSlug: string
  providerName: string | null
  profileUrl: string
  items: SocialProofApiItem[]
}

const MAX_ITEMS = 10
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function jsonWithCors(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const provider = (url.searchParams.get("provider") ?? "").trim()
    const normalizedProvider = provider.toLowerCase().replace(/[\s_]+/g, "-")

    if (!provider) {
      return jsonWithCors({ error: "Missing provider query parameter." }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    let providerRow:
      | {
          profile_id: string
          provider_slug: string | null
          business_name: string | null
        }
      | undefined

    if (isUuid(provider)) {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("profile_id, provider_slug, business_name")
        .eq("is_active", true)
        .eq("profile_id", provider)
        .limit(1)
      if (error) {
        console.error("[api/social-proof] provider lookup by id", error)
        return jsonWithCors({ error: "Failed to load provider." }, { status: 500 })
      }
      providerRow = data?.[0]
    } else {
      const { data: bySlug, error: bySlugError } = await supabase
        .from("provider_profiles")
        .select("profile_id, provider_slug, business_name")
        .eq("is_active", true)
        .or(`provider_slug.eq.${provider},provider_slug.eq.${normalizedProvider}`)
        .limit(1)
      if (bySlugError) {
        console.error("[api/social-proof] provider lookup by slug", bySlugError)
        return jsonWithCors({ error: "Failed to load provider." }, { status: 500 })
      }
      providerRow = bySlug?.[0]

      if (!providerRow) {
        const { data: byName, error: byNameError } = await supabase
          .from("provider_profiles")
          .select("profile_id, provider_slug, business_name")
          .eq("is_active", true)
          .ilike("business_name", provider)
          .limit(1)
        if (byNameError) {
          console.error("[api/social-proof] provider lookup by name", byNameError)
          return jsonWithCors({ error: "Failed to load provider." }, { status: 500 })
        }
        providerRow = byName?.[0]
      }
    }

    if (!providerRow?.provider_slug) {
      return jsonWithCors({ error: "Provider not found." }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("social_proofs" as never)
      .select("id, type, content, rating, image_url, video_url, author_name")
      .eq("provider_profile_id", providerRow.profile_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS)

    if (error) {
      console.error("[api/social-proof] social_proofs lookup", error)
      return jsonWithCors({ error: "Failed to load social proof." }, { status: 500 })
    }

    const response: SocialProofApiResponse = {
      providerId: providerRow.profile_id,
      providerSlug: providerRow.provider_slug,
      providerName: providerRow.business_name ?? null,
      profileUrl: `/providers/${providerRow.provider_slug}`,
      items: ((data ?? []) as Array<{
        id: string
        type: "text" | "image" | "video"
        content: string
        rating: number | null
        image_url: string | null
        video_url: string | null
        author_name: string | null
      }>).map((item) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        rating: item.rating,
        imageUrl: item.image_url,
        videoUrl: item.video_url,
        authorName: item.author_name,
      })),
    }

    return jsonWithCors(response, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[api/social-proof] unexpected error", error)
    return jsonWithCors({ error: "Failed to load social proof." }, { status: 500 })
  }
}
