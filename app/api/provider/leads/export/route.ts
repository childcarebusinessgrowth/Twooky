import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import {
  getInquiriesByProviderProfileId,
  getGuestInquiriesByProviderProfileId,
} from "@/lib/parent-engagement"

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatChildAgeFromDob(dob: string | null): string {
  if (!dob) return ""
  const d = new Date(`${dob}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ""
  const now = new Date()
  const months =
    (now.getUTCFullYear() - d.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - d.getUTCMonth())
  if (months < 0) return ""
  if (months < 24) return `${months} mo`
  const years = Math.floor(months / 12)
  const remainderMonths = months % 12
  if (remainderMonths === 0) return `${years} yr${years === 1 ? "" : "s"}`
  return `${years}y ${remainderMonths}m`
}

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
    const [inquiries, guestInquiries, guestData] = await Promise.all([
      getInquiriesByProviderProfileId(supabase, providerProfileId),
      getGuestInquiriesByProviderProfileId(supabase, providerProfileId),
      supabase
        .from("guest_inquiries")
        .select("id, email, telephone, child_dob")
        .eq("provider_profile_id", providerProfileId),
    ])

    const guestById = new Map(
      (guestData.data ?? []).map((g) => [g.id, g])
    )

    const headers = [
      "Parent Name",
      "Email",
      "Phone",
      "Child Age",
      "Program Interest",
      "Timestamp",
      "Source",
      "Status",
      "Type",
    ]

    const rows: string[][] = []

    for (const i of inquiries) {
      const parentName = (i.parent_display_name ?? "Parent").trim()
      const email = i.parent_email ?? ""
      const phone = ""
      const childAge = i.child_age_group ?? ""
      const programInterest = i.inquiry_subject ?? ""
      const timestamp = i.updated_at
      const source = i.source ?? "directory"
      const status = i.lead_status ?? "new"
      rows.push([
        escapeCsv(parentName),
        escapeCsv(email),
        escapeCsv(phone),
        escapeCsv(childAge),
        escapeCsv(programInterest),
        escapeCsv(timestamp),
        escapeCsv(source),
        escapeCsv(status),
        "Inquiry",
      ])
    }

    for (const g of guestInquiries) {
      const full = guestById.get(g.id)
      const parentName = `${g.first_name} ${g.last_name}`.trim() || "Guest"
      const email = full?.email ?? ""
      const phone = full?.telephone ?? ""
      const childAge = formatChildAgeFromDob(full?.child_dob ?? null)
      const programInterest = g.program_interest ?? ""
      const timestamp = g.created_at
      const source = g.source ?? "directory"
      const status = "Contact request"
      rows.push([
        escapeCsv(parentName),
        escapeCsv(email),
        escapeCsv(phone),
        escapeCsv(childAge),
        escapeCsv(programInterest),
        escapeCsv(timestamp),
        escapeCsv(source),
        escapeCsv(status),
        "Guest",
      ])
    }

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const bom = "\uFEFF"
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" })

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    console.error("Leads export API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
