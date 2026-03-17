"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole, getCurrentUserRole } from "@/lib/authzServer"

const CLAIM_DOCUMENTS_BUCKET = "claim-documents"
const SIGNED_URL_EXPIRY_SECONDS = 3600

export type ClaimDocument = {
  id: string
  document_type: string
  storage_path: string
  mime_type: string
  file_size: number
  signed_url: string | null
}

export type AdminClaimRow = {
  id: string
  claimant_name: string
  email: string
  phone: string
  business_name: string
  business_address: string
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  reviewed_at: string | null
  review_notes: string | null
  match_status: "auto_matched" | "possible_match" | "unmatched" | null
  match_score: number | null
  matched_provider_profile_id: string | null
  matched_business_name: string | null
  documents: ClaimDocument[]
}

export async function getAdminClaims(): Promise<{
  pending: AdminClaimRow[]
  processed: AdminClaimRow[]
  pendingCount: number
  processedCount: number
}> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { data: claims, error } = await supabase
    .from("provider_listing_claims")
    .select(
      "id, claimant_name, email, phone, business_name, business_address, status, submitted_at, reviewed_at, review_notes, match_status, match_score, matched_provider_profile_id"
    )
    .order("submitted_at", { ascending: false })

  if (error) return { pending: [], processed: [], pendingCount: 0, processedCount: 0 }

  const pending = (claims ?? []).filter((c) => c.status === "pending")
  const processed = (claims ?? []).filter((c) => c.status !== "pending")
  const pendingCount = pending.length
  const processedCount = processed.length

  const claimIds = (claims ?? []).map((c) => c.id)
  const { data: docs } = await supabase
    .from("provider_listing_claim_documents")
    .select("id, claim_id, document_type, storage_path, mime_type, file_size")
    .in("claim_id", claimIds)

  const docsByClaim = new Map<string, { id: string; document_type: string; storage_path: string; mime_type: string; file_size: number }[]>()
  for (const d of docs ?? []) {
    const list = docsByClaim.get(d.claim_id) ?? []
    list.push({
      id: d.id,
      document_type: d.document_type,
      storage_path: d.storage_path,
      mime_type: d.mime_type,
      file_size: d.file_size,
    })
    docsByClaim.set(d.claim_id, list)
  }

  const matchedIds = [...new Set((claims ?? []).map((c) => c.matched_provider_profile_id).filter(Boolean))] as string[]
  const { data: providers } =
    matchedIds.length > 0
      ? await supabase
          .from("provider_profiles")
          .select("profile_id, business_name")
          .in("profile_id", matchedIds)
      : { data: [] }
  const providerNames = new Map((providers ?? []).map((p) => [p.profile_id, p.business_name]))

  async function withSignedUrls(rows: typeof claims): Promise<AdminClaimRow[]> {
    const result: AdminClaimRow[] = []
    for (const c of rows ?? []) {
      const docList = docsByClaim.get(c.id) ?? []
      const docsWithUrls: ClaimDocument[] = []
      for (const d of docList) {
        const { data: signed } = await supabase.storage
          .from(CLAIM_DOCUMENTS_BUCKET)
          .createSignedUrl(d.storage_path, SIGNED_URL_EXPIRY_SECONDS)
        docsWithUrls.push({
          ...d,
          signed_url: signed?.signedUrl ?? null,
        })
      }
      result.push({
        id: c.id,
        claimant_name: c.claimant_name,
        email: c.email,
        phone: c.phone,
        business_name: c.business_name,
        business_address: c.business_address,
        status: c.status as "pending" | "approved" | "rejected",
        submitted_at: c.submitted_at,
        reviewed_at: c.reviewed_at,
        review_notes: c.review_notes,
        match_status: c.match_status as AdminClaimRow["match_status"],
        match_score: c.match_score,
        matched_provider_profile_id: c.matched_provider_profile_id,
        matched_business_name: c.matched_provider_profile_id
          ? providerNames.get(c.matched_provider_profile_id) ?? null
          : null,
        documents: docsWithUrls,
      })
    }
    return result
  }

  const [pendingRows, processedRows] = await Promise.all([
    withSignedUrls(pending),
    withSignedUrls(processed),
  ])

  return {
    pending: pendingRows,
    processed: processedRows,
    pendingCount,
    processedCount,
  }
}

export async function getPendingClaimsCount(): Promise<number> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { count, error } = await supabase
    .from("provider_listing_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
  if (error) return 0
  return count ?? 0
}

export type ReviewClaimResult = { success: true } | { success: false; error: string }

export async function approveClaim(claimId: string, notes?: string): Promise<ReviewClaimResult> {
  const { user } = await getCurrentUserRole("admin")
  if (!user) return { success: false, error: "Unauthorized" }
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("provider_listing_claims")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_notes: notes ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/claims")
  revalidatePath("/admin")
  return { success: true }
}

export async function rejectClaim(claimId: string, notes?: string): Promise<ReviewClaimResult> {
  const { user } = await getCurrentUserRole("admin")
  if (!user) return { success: false, error: "Unauthorized" }
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("provider_listing_claims")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_notes: notes ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/claims")
  revalidatePath("/admin")
  return { success: true }
}

export type DeleteClaimResult = { success: true } | { success: false; error: string }

export async function deleteClaim(claimId: string): Promise<DeleteClaimResult> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { data: claim, error: fetchError } = await supabase
    .from("provider_listing_claims")
    .select("id, status")
    .eq("id", claimId)
    .single()

  if (fetchError || !claim) return { success: false, error: "Claim not found" }
  if (claim.status === "pending") return { success: false, error: "Cannot delete pending claims" }

  const { data: docs } = await supabase
    .from("provider_listing_claim_documents")
    .select("storage_path")
    .eq("claim_id", claimId)

  const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean)
  if (paths.length > 0) {
    await supabase.storage.from(CLAIM_DOCUMENTS_BUCKET).remove(paths)
  }

  const { error: deleteError } = await supabase
    .from("provider_listing_claims")
    .delete()
    .eq("id", claimId)

  if (deleteError) return { success: false, error: deleteError.message }
  revalidatePath("/admin/claims")
  revalidatePath("/admin")
  return { success: true }
}
