import { randomUUID } from "crypto"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { matchClaimToListing } from "@/lib/claim-listing-match"
import { z } from "zod"

const CLAIM_DOCUMENTS_BUCKET = "claim-documents"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
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
      if (f.size > MAX_FILE_SIZE_BYTES) {
        return { success: false, error: `File "${f.name}" exceeds 10MB limit.` }
      }
      if (!ALLOWED_MIME_TYPES.has(f.type) && !f.type.startsWith("image/")) {
        return { success: false, error: `File "${f.name}" must be PDF or image (JPEG, PNG, WebP).` }
      }
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
