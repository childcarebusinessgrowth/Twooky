import { randomUUID } from "crypto"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { matchClaimToListing } from "@/lib/claim-listing-match"
import { z } from "zod"
import { CLAIM_DOCUMENTS_BUCKET, MAX_FILE_SIZE_BYTES } from "@/lib/claim-listing-constants"
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

const DOCUMENT_TYPES = ["Business License", "ID Verification", "Utility Bill", "Other"] as const

const submitSchema = z.object({
  claimant_name: z.string().min(1, "Name is required").max(200),
  business_name: z.string().min(1, "Business name is required").max(300),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required").max(50),
  business_address: z.string().min(1, "Business address is required").max(500),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
  document_type: z.enum(DOCUMENT_TYPES),
})

export type SubmitClaimResult = { success: true } | { success: false; error: string }

export type InitClaimResult =
  | { success: true; claimId: string; uploads: { path: string; token: string }[] }
  | { success: false; error: string }

export type CompleteClaimResult = SubmitClaimResult

async function ensureClaimDocumentsBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(listError.message)
  const exists = buckets?.some((b) => b.name === CLAIM_DOCUMENTS_BUCKET)
  if (exists) return
  const { error: createError } = await supabase.storage.createBucket(CLAIM_DOCUMENTS_BUCKET, {
    public: false,
    fileSizeLimit: String(MAX_FILE_SIZE_BYTES),
  })
  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message)
  }
}

function validateFile(file: { name: string; size: number; type: string }): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File "${file.name}" exceeds 10MB limit.`
  }
  if (!ALLOWED_MIME_TYPES.has(file.type) && !file.type.startsWith("image/")) {
    return `File "${file.name}" must be PDF or image (JPEG, PNG, WebP).`
  }
  return null
}

/** Init flow: create claim, return signed upload URLs. Client uploads directly to Supabase. */
export async function initClaimSubmission(data: {
  claimant_name: string
  business_name: string
  email: string
  phone: string
  business_address: string
  consent: boolean
  document_type: string
  files: { name: string; size: number; type: string }[]
}): Promise<InitClaimResult> {
  try {
    const parsed = submitSchema.safeParse({
      ...data,
      document_type: data.document_type || "Other",
    })
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg = Object.values(first).flat().find(Boolean) ?? "Invalid form data"
      return { success: false, error: String(msg) }
    }

    const files = data.files.filter((f) => f && f.size > 0 && f.name)
    if (files.length === 0) {
      return { success: false, error: "At least one verification document is required." }
    }

    for (const f of files) {
      const err = validateFile(f)
      if (err) return { success: false, error: err }
    }

    const supabase = getSupabaseAdminClient()
    await ensureClaimDocumentsBucket()

    const { data: claim, error: insertError } = await supabase
      .from("provider_listing_claims")
      .insert({
        claimant_name: parsed.data.claimant_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        business_name: parsed.data.business_name,
        business_address: parsed.data.business_address,
        status: "pending",
        consent_version: "v1",
      })
      .select("id")
      .single()

    if (insertError || !claim) {
      return { success: false, error: insertError?.message ?? "Failed to save claim." }
    }

    const claimId = claim.id
    const uploads: { path: string; token: string }[] = []

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin"
      const storagePath = `${claimId}/${randomUUID()}.${safeExt}`
      const { data: signed, error: signedError } = await supabase.storage
        .from(CLAIM_DOCUMENTS_BUCKET)
        .createSignedUploadUrl(storagePath)
      if (signedError || !signed?.token) {
        return { success: false, error: `Failed to create upload URL: ${signedError?.message ?? "Unknown error"}` }
      }
      uploads.push({ path: storagePath, token: signed.token })
    }

    return { success: true, claimId, uploads }
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}

/** Complete flow: register uploaded documents, run match, create notification. */
export async function completeClaimSubmission(data: {
  claimId: string
  document_type: string
  documents: { path: string; mime_type: string; file_size: number }[]
}): Promise<CompleteClaimResult> {
  try {
    const supabase = getSupabaseAdminClient()
    const docType = data.document_type || "Other"

    for (const doc of data.documents) {
      const { error: docError } = await supabase.from("provider_listing_claim_documents").insert({
        claim_id: data.claimId,
        document_type: docType,
        storage_path: doc.path,
        mime_type: doc.mime_type,
        file_size: doc.file_size,
      })
      if (docError) {
        return { success: false, error: `Failed to save document record: ${docError.message}` }
      }
    }

    const { data: claim } = await supabase
      .from("provider_listing_claims")
      .select("business_name, claimant_name")
      .eq("id", data.claimId)
      .single()

    if (claim) {
      const { data: claimRow } = await supabase
        .from("provider_listing_claims")
        .select("business_name, business_address")
        .eq("id", data.claimId)
        .single()

      const { data: candidates } = await supabase
        .from("provider_profiles")
        .select("profile_id, business_name, address")

      const matchResult = matchClaimToListing(
        claimRow?.business_name ?? claim.business_name ?? "",
        claimRow?.business_address ?? "",
        candidates ?? []
      )

      await supabase
        .from("provider_listing_claims")
        .update({
          match_status: matchResult.status,
          match_score: matchResult.score,
          matched_provider_profile_id: matchResult.matchedProviderProfileId,
          match_metadata: matchResult.metadata,
        })
        .eq("id", data.claimId)

      await supabase.from("admin_notifications").insert({
        type: "claim_request",
        title: "New listing claim request",
        message: `${claim.business_name} by ${claim.claimant_name}`,
        href: "/admin/claims",
      })
    }

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}

/** Legacy: process full FormData (files go through server, subject to 4.5MB limit). */
export async function processClaimSubmission(formData: FormData): Promise<SubmitClaimResult> {
  try {
    const parsed = submitSchema.safeParse({
      claimant_name: formData.get("claimant_name")?.toString()?.trim(),
      business_name: formData.get("business_name")?.toString()?.trim(),
      email: formData.get("email")?.toString()?.trim(),
      phone: formData.get("phone")?.toString()?.trim(),
      business_address: formData.get("business_address")?.toString()?.trim(),
      consent: formData.get("consent") === "on",
      document_type: formData.get("document_type")?.toString() ?? "Other",
    })
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg = Object.values(first).flat().find(Boolean) ?? "Invalid form data"
      return { success: false, error: String(msg) }
    }

    const files = formData.getAll("documents") as File[]
    const validFiles = files.filter((f) => f && f.size > 0 && f.name)
    if (validFiles.length === 0) {
      return { success: false, error: "At least one verification document is required." }
    }

    for (const f of validFiles) {
      const err = validateFile({ name: f.name, size: f.size, type: f.type })
      if (err) return { success: false, error: err }
    }

    const supabase = getSupabaseAdminClient()
    await ensureClaimDocumentsBucket()

    const { data: claim, error: insertError } = await supabase
      .from("provider_listing_claims")
      .insert({
        claimant_name: parsed.data.claimant_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        business_name: parsed.data.business_name,
        business_address: parsed.data.business_address,
        status: "pending",
        consent_version: "v1",
      })
      .select("id")
      .single()

    if (insertError || !claim) {
      return { success: false, error: insertError?.message ?? "Failed to save claim." }
    }

    const claimId = claim.id
    const docType = parsed.data.document_type

    for (const file of validFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin"
      const storagePath = `${claimId}/${randomUUID()}.${safeExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await supabase.storage
        .from(CLAIM_DOCUMENTS_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        })
      if (uploadError) {
        return { success: false, error: `Failed to upload document: ${uploadError.message}` }
      }
      const { error: docError } = await supabase.from("provider_listing_claim_documents").insert({
        claim_id: claimId,
        document_type: docType,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
      })
      if (docError) {
        return { success: false, error: `Failed to save document record: ${docError.message}` }
      }
    }

    const { data: candidates } = await supabase
      .from("provider_profiles")
      .select("profile_id, business_name, address")

    const match = matchClaimToListing(
      parsed.data.business_name,
      parsed.data.business_address,
      candidates ?? []
    )

    await supabase
      .from("provider_listing_claims")
      .update({
        match_status: match.status,
        match_score: match.score,
        matched_provider_profile_id: match.matchedProviderProfileId,
        match_metadata: match.metadata,
      })
      .eq("id", claimId)

    await supabase.from("admin_notifications").insert({
      type: "claim_request",
      title: "New listing claim request",
      message: `${parsed.data.business_name} by ${parsed.data.claimant_name}`,
      href: "/admin/claims",
    })

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}
