import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import {
  getInquiriesByProviderProfileId,
  getGuestInquiriesByProviderProfileId,
  getReviewsByProviderProfileId,
} from "@/lib/parent-engagement"

export type ProviderNotificationItem = {
  id: string
  type: "inquiry" | "review" | "listing_confirmed"
  title: string
  message: string
  time: string
  href: string
  /** Set for rows from provider_notifications; null = unread */
  readAt: string | null
}

function formatNotificationTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0)
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" })
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

const NOTIFICATION_LIMIT = 15

export async function GET() {
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

    const providerProfileId = user.id

    const [inquiries, guestInquiries, reviews, { data: notificationRows }] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, providerProfileId),
      getGuestInquiriesByProviderProfileId(supabase, providerProfileId),
      getReviewsByProviderProfileId(supabase, providerProfileId),
      supabase
        .from("provider_notifications")
        .select("id, type, title, message, href, created_at, read_at")
        .eq("provider_profile_id", providerProfileId)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    type ItemWithSort = ProviderNotificationItem & { sortAt: string }
    const items: ItemWithSort[] = []

    ;(notificationRows ?? []).forEach((row) => {
      items.push({
        id: row.id,
        type: (row.type as "listing_confirmed") || "listing_confirmed",
        title: row.title ?? "Notification",
        message: row.message ?? "",
        time: formatNotificationTime(row.created_at),
        href: row.href ?? "/dashboard/provider",
        readAt: row.read_at ?? null,
        sortAt: row.created_at,
      })
    })

    inquiries.slice(0, 8).forEach((row) => {
      const name = row.parent_display_name?.trim() || "A parent"
      items.push({
        id: row.id,
        type: "inquiry",
        title: `New inquiry from ${name}`,
        message: (row.inquiry_subject?.trim() || "Message sent").slice(0, 80),
        time: formatNotificationTime(row.updated_at),
        href: `/dashboard/provider/inquiries?open=${row.id}`,
        readAt: null,
        sortAt: row.updated_at,
      })
    })

    guestInquiries.slice(0, 8).forEach((row) => {
      const name = `${row.first_name} ${row.last_name}`.trim() || "A guest"
      items.push({
        id: row.id,
        type: "inquiry",
        title: `New inquiry from ${name}`,
        message: "Guest inquiry",
        time: formatNotificationTime(row.created_at),
        href: `/dashboard/provider/inquiries?open=${row.id}`,
        readAt: null,
        sortAt: row.created_at,
      })
    })

    reviews.slice(0, 8).forEach((row) => {
      const name = row.parent_display_name?.trim() || "A parent"
      const snippet = row.review_text.trim().slice(0, 60)
      items.push({
        id: row.id,
        type: "review",
        title: `New ${row.rating}★ review from ${name}`,
        message: snippet ? `"${snippet}${row.review_text.length > 60 ? "…" : ""}"` : "New review",
        time: formatNotificationTime(row.created_at),
        href: "/dashboard/provider/reviews",
        readAt: null,
        sortAt: row.created_at,
      })
    })

    items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())

    const notifications: ProviderNotificationItem[] = items
      .slice(0, NOTIFICATION_LIMIT)
      .map((item) => {
        const { sortAt, ...notification } = item
        void sortAt
        return notification
      })

    return NextResponse.json({ notifications })
  } catch (e) {
    console.error("Provider notifications error:", e)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

/** Mark provider notifications as read. Only rows in provider_notifications are updated. */
export async function PATCH(request: Request) {
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

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter((id) => typeof id === "string") : []

    if (ids.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from("provider_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("provider_profile_id", user.id)
      .in("id", ids)

    if (error) {
      console.error("Provider notifications mark read error:", error)
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Provider notifications mark read error:", e)
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
  }
}
