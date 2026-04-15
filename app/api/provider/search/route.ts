import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import {
  getInquiriesByProviderProfileId,
  getReviewsByProviderProfileId,
} from "@/lib/parent-engagement"
import type { ProviderInquiryPreviewRow } from "@/lib/parent-engagement"
import type { PublicReviewRow } from "@/lib/parent-engagement"

const MAX_PROVIDER_SEARCH_RESULTS = 25
const MAX_REVIEW_SEARCH_ROWS = 50

type GuestInquirySearchRow = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
}

function matchesQuery(text: string | null | undefined, q: string): boolean {
  if (!text || !q) return false
  return text.toLowerCase().includes(q.toLowerCase())
}

function toIlikePattern(value: string): string {
  return `%${value.replace(/[,%]/g, " ").trim()}%`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") ?? "").trim()
    if (!q) {
      return NextResponse.json({ inquiries: [], guestInquiries: [], reviews: [] })
    }

    const { providerProfileId, canAccessProviderSearch } = await getProviderPlanAccessForUser(supabase, user.id)
    if (!canAccessProviderSearch) {
      return NextResponse.json({ error: "Search is only available on Thrive and higher plans." }, { status: 403 })
    }
    const guestPattern = toIlikePattern(q)

    const [inquiries, guestRows, reviews] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, providerProfileId, {
        limit: MAX_PROVIDER_SEARCH_RESULTS,
        query: q,
      }),
      supabase
        .from("guest_inquiries")
        .select("id, created_at, first_name, last_name, email")
        .eq("provider_profile_id", providerProfileId)
        .or(`first_name.ilike.${guestPattern},last_name.ilike.${guestPattern},email.ilike.${guestPattern}`)
        .order("created_at", { ascending: false })
        .limit(MAX_PROVIDER_SEARCH_RESULTS),
      getReviewsByProviderProfileId(supabase, providerProfileId, {
        limit: MAX_REVIEW_SEARCH_ROWS,
      }),
    ])

    const guestInquiries: GuestInquirySearchRow[] = (guestRows.data ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      email: r.email ?? "",
    }))

    const filteredInquiries: ProviderInquiryPreviewRow[] = inquiries.slice(0, MAX_PROVIDER_SEARCH_RESULTS)

    const filteredGuestInquiries: GuestInquirySearchRow[] = guestInquiries.slice(0, MAX_PROVIDER_SEARCH_RESULTS)

    const filteredReviews: PublicReviewRow[] = reviews.filter(
      (r) =>
        matchesQuery(r.parent_display_name, q) ||
        matchesQuery(r.review_text, q) ||
        matchesQuery(r.provider_reply_text, q)
    ).slice(0, MAX_PROVIDER_SEARCH_RESULTS)

    return NextResponse.json({
      inquiries: filteredInquiries,
      guestInquiries: filteredGuestInquiries,
      reviews: filteredReviews,
    })
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
