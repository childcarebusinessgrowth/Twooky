"use server"

import { processClaimSubmission } from "@/lib/claim-listing-submit"

export type SubmitClaimResult = { success: true } | { success: false; error: string }

export async function submitClaimListing(formData: FormData): Promise<SubmitClaimResult> {
  return processClaimSubmission(formData)
}
