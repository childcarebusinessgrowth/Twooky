import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import {
  getInquiriesByProviderProfileId,
  getReviewsByProviderProfileId,
} from "@/lib/parent-engagement"
import type { ProviderInquiryPreviewRow } from "@/lib/parent-engagement"
import type { PublicReviewRow } from "@/lib/parent-engagement"

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

    const [inquiries, guestRows, reviews] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, user.id),
      supabase
        .from("guest_inquiries")
        .select("id, created_at, first_name, last_name, email")
        .eq("provider_profile_id", user.id)
        .order("created_at", { ascending: false }),
      getReviewsByProviderProfileId(supabase, user.id),
    ])

    const guestInquiries: GuestInquirySearchRow[] = (guestRows.data ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      email: r.email ?? "",
    }))

    const filteredInquiries: ProviderInquiryPreviewRow[] = inquiries.filter(
      (i) =>
        matchesQuery(i.parent_display_name, q) ||
        matchesQuery(i.parent_email, q) ||
        matchesQuery(i.inquiry_subject, q)
    )

    const filteredGuestInquiries: GuestInquirySearchRow[] = guestInquiries.filter(
      (g) => {
        const fullName = `${g.first_name} ${g.last_name}`.trim()
        return (
          matchesQuery(fullName, q) ||
          matchesQuery(g.first_name, q) ||
          matchesQuery(g.last_name, q) ||
          matchesQuery(g.email, q)
        )
      }
    )

    const filteredReviews: PublicReviewRow[] = reviews.filter(
      (r) =>
        matchesQuery(r.parent_display_name, q) ||
        matchesQuery(r.review_text, q) ||
        matchesQuery(r.provider_reply_text, q)
    )

    return NextResponse.json({
      inquiries: filteredInquiries,
      guestInquiries: filteredGuestInquiries,
      reviews: filteredReviews,
    })
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
