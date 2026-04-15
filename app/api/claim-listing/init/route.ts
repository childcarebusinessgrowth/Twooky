import { NextResponse } from "next/server"
import { initClaimSubmission } from "@/lib/claim-listing-submit"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "claim-listing-init",
    limit: 5,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const body = await request.json()
    const result = await initClaimSubmission({
      claimant_name: body.claimant_name?.toString()?.trim() ?? "",
      business_name: body.business_name?.toString()?.trim() ?? "",
      email: body.email?.toString()?.trim() ?? "",
      phone: body.phone?.toString()?.trim() ?? "",
      business_address: body.business_address?.toString()?.trim() ?? "",
      consent: body.consent === true,
      document_type: body.document_type?.toString() ?? "Other",
      files: Array.isArray(body.files) ? body.files : [],
    })
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
