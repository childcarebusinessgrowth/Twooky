import { NextResponse } from "next/server"
import { initClaimSubmission } from "@/lib/claim-listing-submit"

export async function POST(request: Request) {
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
