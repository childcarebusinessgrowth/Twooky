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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const provider = (url.searchParams.get("provider") ?? "").trim()

    if (!provider) {
      return NextResponse.json({ error: "Missing provider query parameter." }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    let providerRequest = supabase
      .from("provider_profiles")
      .select("profile_id, provider_slug, business_name")
      .eq("is_active", true)

    if (isUuid(provider)) {
      providerRequest = providerRequest.eq("profile_id", provider)
    } else {
      providerRequest = providerRequest.eq("provider_slug", provider)
    }

    const { data: providerRow, error: providerError } = await providerRequest.maybeSingle()
    if (providerError) {
      console.error("[api/social-proof] provider lookup", providerError)
      return NextResponse.json({ error: "Failed to load provider." }, { status: 500 })
    }

    if (!providerRow?.provider_slug) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 })
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
      return NextResponse.json({ error: "Failed to load social proof." }, { status: 500 })
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

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[api/social-proof] unexpected error", error)
    return NextResponse.json({ error: "Failed to load social proof." }, { status: 500 })
  }
}
