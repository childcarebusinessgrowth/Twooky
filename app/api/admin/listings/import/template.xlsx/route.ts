import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { assertServerRole } from "@/lib/authzServer"
import { BULK_PROVIDER_IMPORT_COLUMNS } from "@/app/admin/listings/import/importSchema"
import { publicMessageForError } from "@/lib/publicErrors"

export const runtime = "nodejs"

export async function GET() {
  try {
    await assertServerRole("admin")

    const headers = BULK_PROVIDER_IMPORT_COLUMNS.map((c) => c.header)
    const exampleRow = BULK_PROVIDER_IMPORT_COLUMNS.map((c) => c.example ?? "")

    const rows = [headers, exampleRow]
    const listingsSheet = XLSX.utils.aoa_to_sheet(rows)

    const instructionsRows: string[][] = [
      ["Bulk Provider Import Template"],
      [""],
      ["Notes"],
      ["- Images are NOT imported. Add photos later from the listing page."],
      ["- Required columns must be filled for each row."],
      ["- You can fill either friendly columns (country, currencyCode, cityCatalog) or the UUID id columns."],
      ["- listingStatus must be one of: active, pending, inactive (defaults to active)."],
      [""],
      ["Columns"],
      ["header", "required", "description", "example"],
      ...BULK_PROVIDER_IMPORT_COLUMNS.map((c) => [
        c.header,
        c.required ? "yes" : "no",
        c.description,
        c.example ?? "",
      ]),
    ]
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsRows)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, listingsSheet, "Listings")
    XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions")

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    return new NextResponse(blob, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="provider-import-template.xlsx"`,
      },
    })
  } catch (e) {
    console.error("XLSX template download error:", e)
    const message = e instanceof Error ? e.message : ""
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: publicMessageForError(e, "Unable to generate template.") }, { status })
  }
}

