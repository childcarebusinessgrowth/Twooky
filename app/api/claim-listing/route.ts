import { NextResponse } from "next/server"
import { processClaimSubmission } from "@/lib/claim-listing-submit"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "claim-listing",
    limit: 3,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const formData = await request.formData()
    const result = await processClaimSubmission(formData)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
