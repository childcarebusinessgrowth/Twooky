import { NextResponse } from "next/server"
import { completeClaimSubmission } from "@/lib/claim-listing-submit"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "claim-listing-complete",
    limit: 5,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

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
