import { NextResponse } from "next/server"
import { completeClaimSubmission } from "@/lib/claim-listing-submit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await completeClaimSubmission({
      claimId: body.claimId?.toString() ?? "",
      document_type: body.document_type?.toString() ?? "Other",
      documents: Array.isArray(body.documents) ? body.documents : [],
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
