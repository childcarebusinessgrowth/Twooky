import { NextResponse } from "next/server"
import { assertServerRole } from "@/lib/authzServer"
import { BULK_PROVIDER_IMPORT_COLUMNS } from "@/app/admin/listings/import/importSchema"
import { publicMessageForError } from "@/lib/publicErrors"

export const runtime = "nodejs"

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET() {
  try {
    await assertServerRole("admin")

    const headers = BULK_PROVIDER_IMPORT_COLUMNS.map((c) => c.header)

    const exampleRow = BULK_PROVIDER_IMPORT_COLUMNS.map((c) => escapeCsv(c.example ?? ""))

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n")
    const bom = "\uFEFF"
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8" })

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="provider-import-template.csv"`,
      },
    })
  } catch (e) {
    console.error("CSV template download error:", e)
    const message = e instanceof Error ? e.message : ""
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: publicMessageForError(e, "Unable to generate template.") }, { status })
  }
}

