"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { getPasswordResetRedirectUrl } from "@/lib/email/brand"
import { sendClaimApprovedOnboardingEmail } from "@/lib/email/claimApprovedOnboarding"
import { sendClaimRejectedEmail } from "@/lib/email/claimRejected"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission, getCurrentAdminAccess } from "@/lib/authzServer"

const CLAIM_DOCUMENTS_BUCKET = "claim-documents"
const SIGNED_URL_EXPIRY_SECONDS = 3600

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function generateTemporaryPassword(length = 18): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?"
  const bytes = randomBytes(length)
  let value = ""
  for (let i = 0; i < length; i += 1) {
    value += alphabet[bytes[i] % alphabet.length]
  }
  return value
}

async function ensureProviderAccountByEmail(params: {
  email: string
  claimantName: string
}): Promise<{ ok: true; profileId: string; email: string } | { ok: false; error: string }> {
  const supabase = getSupabaseAdminClient()
  const normalizedEmail = normalizeEmail(params.email)
  if (!normalizedEmail) {
    return { ok: false, error: "Claim is missing a valid email address." }
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("email", normalizedEmail)
    .maybeSingle()
  if (existingProfileError) return { ok: false, error: existingProfileError.message }

  if (existingProfile?.id) {
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(existingProfile.id)
    if (authUserError || !authUser.user) {
      return { ok: false, error: "Found profile record without auth account. Please resolve manually." }
    }
    const displayName = existingProfile.display_name?.trim() || params.claimantName.trim() || normalizedEmail
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(existingProfile.id, {
      email: normalizedEmail,
      email_confirm: true,
      app_metadata: { role: "provider" },
      user_metadata: {
        role: "provider",
        display_name: displayName,
      },
    })
    if (authUpdateError) return { ok: false, error: authUpdateError.message }

    const { error: profileUpsertError } = await supabase.from("profiles").upsert(
      {
        id: existingProfile.id,
        email: normalizedEmail,
        role: "provider",
        display_name: displayName,
        is_active: true,
      },
      { onConflict: "id" },
    )
    if (profileUpsertError) return { ok: false, error: profileUpsertError.message }
    return { ok: true, profileId: existingProfile.id, email: normalizedEmail }
  }

  const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: generateTemporaryPassword(),
    email_confirm: true,
    app_metadata: { role: "provider" },
    user_metadata: {
      role: "provider",
      display_name: params.claimantName.trim() || normalizedEmail,
    },
  })
  if (createUserError) return { ok: false, error: createUserError.message }
  const createdUserId = createdUserData.user?.id
  if (!createdUserId) return { ok: false, error: "Could not resolve created user id." }

  const { error: profileInsertError } = await supabase.from("profiles").upsert(
    {
      id: createdUserId,
      email: normalizedEmail,
      role: "provider",
      display_name: params.claimantName.trim() || normalizedEmail,
      is_active: true,
    },
    { onConflict: "id" },
  )
  if (profileInsertError) return { ok: false, error: profileInsertError.message }
  return { ok: true, profileId: createdUserId, email: normalizedEmail }
}

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
  await assertAdminPermission("badges.verify")
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
  await assertAdminPermission("badges.verify")
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
  await assertAdminPermission("badges.verify")
  const { user } = await getCurrentAdminAccess()
  if (!user) return { success: false, error: "Unauthorized" }
  const supabase = getSupabaseAdminClient()
  const cleanNotes = notes?.trim() || null

  const { data: claim, error: claimError } = await supabase
    .from("provider_listing_claims")
    .select("id, status, claimant_name, email, business_name, matched_provider_profile_id")
    .eq("id", claimId)
    .single()
  if (claimError || !claim) return { success: false, error: claimError?.message ?? "Claim not found." }
  if (claim.status !== "pending") return { success: false, error: "Only pending claims can be approved." }
  if (!claim.matched_provider_profile_id) {
    return { success: false, error: "Cannot approve claim without a matched provider profile." }
  }

  const accountResult = await ensureProviderAccountByEmail({
    email: claim.email,
    claimantName: claim.claimant_name,
  })
  if (!accountResult.ok) return { success: false, error: accountResult.error }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: accountResult.email,
    options: { redirectTo: getPasswordResetRedirectUrl() },
  })
  if (linkError || !linkData?.properties?.action_link) {
    console.error("[claims] Could not create onboarding link for approved claim", {
      claimId,
      error: linkError?.message,
    })
    return { success: false, error: "Could not generate the onboarding link for this claimant." }
  }

  const { error: ownerAssignError } = await supabase
    .from("provider_profiles" as never)
    .update({ owner_profile_id: accountResult.profileId } as never)
    .eq("profile_id", claim.matched_provider_profile_id)
  if (ownerAssignError) return { success: false, error: ownerAssignError.message }

  const { error } = await supabase
    .from("provider_listing_claims")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_notes: cleanNotes,
    })
    .eq("id", claimId)
    .eq("status", "pending")

  if (error) return { success: false, error: error.message }

  const approvalEmailSent = await sendClaimApprovedOnboardingEmail({
    to: accountResult.email,
    claimantName: claim.claimant_name,
    businessName: claim.business_name,
    setPasswordLink: linkData.properties.action_link,
  })
  if (!approvalEmailSent) {
    console.warn("[claims] Claim approved but onboarding email was not sent.", { claimId })
  }

  revalidatePath("/admin/claims")
  revalidatePath("/admin")
  return { success: true }
}

export async function rejectClaim(claimId: string, notes?: string): Promise<ReviewClaimResult> {
  await assertAdminPermission("badges.verify")
  const { user } = await getCurrentAdminAccess()
  if (!user) return { success: false, error: "Unauthorized" }
  const rejectionReason = notes?.trim() ?? ""
  if (!rejectionReason) {
    return { success: false, error: "A rejection reason is required." }
  }
  const supabase = getSupabaseAdminClient()
  const { data: claim, error: claimError } = await supabase
    .from("provider_listing_claims")
    .select("id, status, claimant_name, email, business_name")
    .eq("id", claimId)
    .single()
  if (claimError || !claim) return { success: false, error: claimError?.message ?? "Claim not found." }
  if (claim.status !== "pending") return { success: false, error: "Only pending claims can be rejected." }

  const { error } = await supabase
    .from("provider_listing_claims")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      review_notes: rejectionReason,
    })
    .eq("id", claimId)
    .eq("status", "pending")

  if (error) return { success: false, error: error.message }

  const rejectedEmailSent = await sendClaimRejectedEmail({
    to: claim.email,
    claimantName: claim.claimant_name,
    businessName: claim.business_name,
    reason: rejectionReason,
  })
  if (!rejectedEmailSent) {
    console.warn("[claims] Claim rejected but rejection email was not sent.", { claimId })
  }

  revalidatePath("/admin/claims")
  revalidatePath("/admin")
  return { success: true }
}

export type DeleteClaimResult = { success: true } | { success: false; error: string }

export async function deleteClaim(claimId: string): Promise<DeleteClaimResult> {
  await assertAdminPermission("badges.verify")
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
