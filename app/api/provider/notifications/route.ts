import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

export type ProviderNotificationItem = {
  id: string
  type: "inquiry" | "review" | "listing_confirmed" | "review_report_accepted"
  title: string
  message: string
  time: string
  href: string
  /** Set for rows from provider_notifications; null = unread */
  readAt: string | null
}

function mapPersistedNotificationType(
  raw: string | null
): "inquiry" | "review" | "listing_confirmed" | "review_report_accepted" {
  if (raw === "inquiry") return "inquiry"
  if (raw === "review") return "review"
  if (raw === "review_report_accepted") return "review_report_accepted"
  return "listing_confirmed"
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

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const { data: notificationRows } = await supabase
      .from("provider_notifications")
      .select("id, type, title, message, href, created_at, read_at")
      .eq("provider_profile_id", providerProfileId)
      .order("created_at", { ascending: false })
      .limit(20)

    type ItemWithSort = ProviderNotificationItem & { sortAt: string }
    const items: ItemWithSort[] = []

    ;(notificationRows ?? []).forEach((row) => {
      items.push({
        id: row.id,
        type: mapPersistedNotificationType(row.type),
        title: row.title ?? "Notification",
        message: row.message ?? "",
        time: formatNotificationTime(row.created_at),
        href: row.href ?? "/dashboard/provider",
        readAt: row.read_at ?? null,
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

/** Mark provider notifications as read. */
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

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)

    const { error } = await supabase
      .from("provider_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("provider_profile_id", providerProfileId)
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
