import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"

export type AdminNotificationItem = {
  id: string
  type: "provider_signup" | "contact_message" | "review_report" | "listing_pending" | "claim_request"
  title: string
  message: string
  time: string
  href: string
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

const NOTIFICATION_LIMIT = 20

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
    if (resolution.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: rows, error } = await supabase
      .from("admin_notifications")
      .select("id, type, title, message, href, created_at")
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_LIMIT)

    if (error) {
      console.error("Admin notifications load error:", error)
      return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
    }

    const notificationIds = (rows ?? []).map((r) => r.id)
    let readAtByNotification = new Map<string, string | null>()

    if (notificationIds.length > 0) {
      const { data: reads, error: readError } = await supabase
        .from("admin_notification_reads")
        .select("notification_id, read_at")
        .eq("admin_user_id", user.id)
        .in("notification_id", notificationIds)

      if (readError) {
        console.error("Admin notification reads load error:", readError)
      } else {
        readAtByNotification = new Map(
          (reads ?? []).map((r) => [r.notification_id as string, (r.read_at as string | null) ?? null])
        )
      }
    }

    const notifications: AdminNotificationItem[] = (rows ?? []).map((row) => ({
      id: row.id,
      type: (row.type as AdminNotificationItem["type"]) ?? "contact_message",
      title: row.title ?? "Notification",
      message: row.message ?? "",
      time: formatNotificationTime(row.created_at),
      href: row.href ?? "/admin",
      readAt: readAtByNotification.get(row.id) ?? null,
    }))

    return NextResponse.json({ notifications })
  } catch (e) {
    console.error("Admin notifications error:", e)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

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
    if (resolution.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter((id) => typeof id === "string") : []

    if (ids.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const nowIso = new Date().toISOString()
    const rows = ids.map((notificationId) => ({
      notification_id: notificationId,
      admin_user_id: user.id,
      read_at: nowIso,
    }))

    const { error } = await supabase
      .from("admin_notification_reads")
      .upsert(rows, { onConflict: "admin_user_id,notification_id" })

    if (error) {
      console.error("Admin notifications mark read error:", error)
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Admin notifications mark read error:", e)
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
  }
}
