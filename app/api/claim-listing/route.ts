import { NextResponse } from "next/server"
import { processClaimSubmission } from "@/lib/claim-listing-submit"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const result = await processClaimSubmission(formData)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
