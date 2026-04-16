"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { assertAdminPermission } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const ADMIN_PATH = "/admin/social-proof"
const SOCIAL_PROOF_ASSETS_BUCKET = "social-proof-assets"
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"])

export type SocialProofType = "text" | "image" | "video"

export type SocialProofInput = {
  providerProfileId: string
  type: SocialProofType
  content: string
  rating: number | null
  imageUrl: string | null
  videoUrl: string | null
  authorName: string | null
  isActive: boolean
}

export type SocialProofEntryInput = Omit<SocialProofInput, "providerProfileId">

export type SocialProofSetInput = {
  providerProfileId: string
  entries: SocialProofEntryInput[]
}

export type ProviderSearchRow = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
}

function cleanUrl(value: string | null): string | null {
  const next = value?.trim() ?? ""
  return next.length > 0 ? next : null
}

async function ensureSocialProofAssetsBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === SOCIAL_PROOF_ASSETS_BUCKET)
  if (bucketExists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(SOCIAL_PROOF_ASSETS_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_VIDEO_SIZE_BYTES}`,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
  })

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message)
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function uploadSocialProofMedia(file: File, folder: "images" | "videos") {
  await ensureSocialProofAssetsBucket()
  const supabase = getSupabaseAdminClient()
  const safeName = sanitizeFilename(file.name || "asset")
  const today = new Date()
  const pathPrefix = `${folder}/${today.getUTCFullYear()}/${String(today.getUTCMonth() + 1).padStart(2, "0")}`
  const storagePath = `${pathPrefix}/${Date.now()}-${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(SOCIAL_PROOF_ASSETS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(SOCIAL_PROOF_ASSETS_BUCKET).getPublicUrl(storagePath)
  return {
    path: storagePath,
    publicUrl: data.publicUrl,
  }
}

export async function uploadSocialProofImage(file: File) {
  await assertAdminPermission("social-proof.manage")
  if (!file) {
    throw new Error("No image provided.")
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, WEBP, and GIF images are allowed.")
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or less.")
  }
  return uploadSocialProofMedia(file, "images")
}

export async function uploadSocialProofVideo(file: File) {
  await assertAdminPermission("social-proof.manage")
  if (!file) {
    throw new Error("No video provided.")
  }
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    throw new Error("Only MP4, WEBM, and MOV videos are allowed.")
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error("Video must be 25MB or less.")
  }
  return uploadSocialProofMedia(file, "videos")
}

function validateInput(input: SocialProofInput) {
  if (!input.providerProfileId.trim()) {
    throw new Error("Provider is required.")
  }
  if (!input.content.trim()) {
    throw new Error("Content is required.")
  }
  if (!["text", "image", "video"].includes(input.type)) {
    throw new Error("Type is invalid.")
  }
  if (input.rating != null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    throw new Error("Rating must be between 1 and 5.")
  }
  if (input.type === "image" && !cleanUrl(input.imageUrl)) {
    throw new Error("Image upload is required for image testimonials.")
  }
  if (input.type === "video" && !cleanUrl(input.videoUrl)) {
    throw new Error("Video upload is required for video testimonials.")
  }
}

function validateSetInput(input: SocialProofSetInput) {
  const providerProfileId = input.providerProfileId.trim()
  if (!providerProfileId) {
    throw new Error("Provider is required.")
  }
  if (!Array.isArray(input.entries)) {
    throw new Error("Entries are required.")
  }
  if (input.entries.length < 1) {
    throw new Error("At least one social proof entry is required.")
  }
  if (input.entries.length > 3) {
    throw new Error("You can add up to 3 social proof entries.")
  }

  input.entries.forEach((entry) => {
    validateInput({
      providerProfileId,
      type: entry.type,
      content: entry.content,
      rating: entry.rating,
      imageUrl: entry.imageUrl,
      videoUrl: entry.videoUrl,
      authorName: entry.authorName,
      isActive: entry.isActive,
    })
  })
}

export async function searchProviders(query: string): Promise<ProviderSearchRow[]> {
  await assertAdminPermission("social-proof.manage")
  const q = query.trim()
  const supabase = getSupabaseAdminClient()

  let request = supabase
    .from("provider_profiles")
    .select("profile_id, provider_slug, business_name, city")
    .order("business_name", { ascending: true })
    .limit(25)

  if (q.length >= 2) {
    request = request.or(`business_name.ilike.%${q}%,city.ilike.%${q}%,provider_slug.ilike.%${q}%`)
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return (data ?? []) as ProviderSearchRow[]
}

export async function createSocialProof(input: SocialProofInput) {
  await assertAdminPermission("social-proof.manage")
  validateInput(input)

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("social_proofs" as never).insert({
    provider_profile_id: input.providerProfileId.trim(),
    type: input.type,
    content: input.content.trim(),
    rating: input.rating,
    image_url: cleanUrl(input.imageUrl),
    video_url: cleanUrl(input.videoUrl),
    author_name: input.authorName?.trim() || null,
    is_active: input.isActive,
  } as never)
  if (error) throw new Error(error.message)
  revalidatePath(ADMIN_PATH)
}

export async function replaceSocialProofSet(input: SocialProofSetInput) {
  await assertAdminPermission("social-proof.manage")
  validateSetInput(input)

  const providerProfileId = input.providerProfileId.trim()
  const supabase = getSupabaseAdminClient()

  const { error: deactivateError } = await supabase
    .from("social_proofs" as never)
    .update({ is_active: false } as never)
    .eq("provider_profile_id", providerProfileId)

  if (deactivateError) {
    throw new Error(deactivateError.message)
  }

  const rows = input.entries.map((entry) => ({
    provider_profile_id: providerProfileId,
    type: entry.type,
    content: entry.content.trim(),
    rating: entry.rating,
    image_url: cleanUrl(entry.imageUrl),
    video_url: cleanUrl(entry.videoUrl),
    author_name: entry.authorName?.trim() || null,
    is_active: entry.isActive,
  }))

  const { error: insertError } = await supabase.from("social_proofs" as never).insert(rows as never)
  if (insertError) throw new Error(insertError.message)

  revalidatePath(ADMIN_PATH)
}

export async function updateSocialProof(id: string, input: SocialProofInput) {
  await assertAdminPermission("social-proof.manage")
  if (!id) throw new Error("Id is required.")
  validateInput(input)

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("social_proofs" as never)
    .update({
      provider_profile_id: input.providerProfileId.trim(),
      type: input.type,
      content: input.content.trim(),
      rating: input.rating,
      image_url: cleanUrl(input.imageUrl),
      video_url: cleanUrl(input.videoUrl),
      author_name: input.authorName?.trim() || null,
      is_active: input.isActive,
    } as never)
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(ADMIN_PATH)
}

export async function deleteSocialProof(id: string) {
  await assertAdminPermission("social-proof.manage")
  if (!id) throw new Error("Id is required.")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("social_proofs" as never).delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(ADMIN_PATH)
}
