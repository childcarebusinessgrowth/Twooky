"use server"

import { revalidatePath } from "next/cache"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { MAX_PHOTOS_PER_PROVIDER } from "./constants"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

async function revalidatePublicDirectoryAfterListingPhotosChange(profileId: string) {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function ensureProviderPhotosBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === PROVIDER_PHOTOS_BUCKET)
  if (bucketExists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(PROVIDER_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
    allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
  })

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message)
  }
}

export type UploadProviderPhotoResult = { id: string; storagePath: string } | { error: string }

export async function uploadProviderPhoto(formData: FormData): Promise<UploadProviderPhotoResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to upload photos." }
  }

  // Ensure provider_profiles row exists (e.g. user may not have saved listing yet)
  const { error: profileError } = await supabase.from("provider_profiles").upsert(
    { profile_id: user.id },
    { onConflict: "profile_id" }
  )
  if (profileError) {
    return { error: profileError.message }
  }

  const file = formData.get("file") as File | null
  const caption = (formData.get("caption") as string)?.trim() || null

  if (!file || file.size === 0) {
    return { error: "No file provided." }
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Only PNG, JPG, and WebP images are allowed." }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "Image must be 10MB or less." }
  }

  const { count, error: countError } = await supabase
    .from("provider_photos")
    .select("id", { count: "exact", head: true })
    .eq("provider_profile_id", user.id)

  if (countError) {
    return { error: countError.message }
  }
  if ((count ?? 0) >= MAX_PHOTOS_PER_PROVIDER) {
    return {
      error: `Maximum ${MAX_PHOTOS_PER_PROVIDER} photos allowed. Delete a photo to add another.`,
    }
  }

  try {
    await ensureProviderPhotosBucket()
    const admin = getSupabaseAdminClient()

    const safeName = sanitizeFilename(file.name || "image")
    const storagePath = `${user.id}/${randomUUID()}-${safeName}`

    const { error: uploadError } = await admin.storage
      .from(PROVIDER_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return { error: uploadError.message }
    }

    const { data: existing } = await supabase
      .from("provider_photos")
      .select("id")
      .eq("provider_profile_id", user.id)
      .limit(1)
      .maybeSingle()

    const isPrimary = !existing

    const { data: row, error: insertError } = await supabase
      .from("provider_photos")
      .insert({
        provider_profile_id: user.id,
        storage_path: storagePath,
        caption,
        is_primary: isPrimary,
        sort_order: 0,
      })
      .select("id, storage_path")
      .single()

    if (insertError) {
      try {
        await admin.storage.from(PROVIDER_PHOTOS_BUCKET).remove([storagePath])
      } catch {
        // best-effort cleanup
      }
      return { error: insertError.message }
    }

    revalidatePath("/dashboard/provider/photos")
    revalidatePath("/dashboard/provider")
    await revalidatePublicDirectoryAfterListingPhotosChange(user.id)
    return { id: row.id, storagePath: row.storage_path }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed."
    return { error: message }
  }
}

export type UpdateCaptionResult = { ok: true } | { error: string }

export async function updateProviderPhotoCaption(
  photoId: string,
  caption: string
): Promise<UpdateCaptionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to update photos." }
  }

  const { error } = await supabase
    .from("provider_photos")
    .update({ caption: caption.trim() || null })
    .eq("id", photoId)
    .eq("provider_profile_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/photos")
  revalidatePath("/dashboard/provider")
  return { ok: true }
}

export type SetPrimaryResult = { ok: true } | { error: string }

export async function setPrimaryProviderPhoto(photoId: string): Promise<SetPrimaryResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to update photos." }
  }

  const { data: targetPhoto, error: targetPhotoError } = await supabase
    .from("provider_photos")
    .select("id")
    .eq("id", photoId)
    .eq("provider_profile_id", user.id)
    .maybeSingle()

  if (targetPhotoError) {
    return { error: targetPhotoError.message }
  }
  if (!targetPhoto) {
    return { error: "Photo not found." }
  }

  const { data: currentPrimary, error: currentPrimaryError } = await supabase
    .from("provider_photos")
    .select("id")
    .eq("provider_profile_id", user.id)
    .eq("is_primary", true)
    .maybeSingle()

  if (currentPrimaryError) {
    return { error: currentPrimaryError.message }
  }

  if (currentPrimary?.id === photoId) {
    return { ok: true }
  }

  const { error: unsetError } = await supabase
    .from("provider_photos")
    .update({ is_primary: false })
    .eq("provider_profile_id", user.id)

  if (unsetError) {
    return { error: unsetError.message }
  }

  const { error: setError } = await supabase
    .from("provider_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("provider_profile_id", user.id)

  if (setError) {
    if (currentPrimary?.id) {
      await supabase
        .from("provider_photos")
        .update({ is_primary: true })
        .eq("id", currentPrimary.id)
        .eq("provider_profile_id", user.id)
    }
    return { error: setError.message }
  }

  revalidatePath("/dashboard/provider/photos")
  revalidatePath("/dashboard/provider")
  await revalidatePublicDirectoryAfterListingPhotosChange(user.id)
  return { ok: true }
}

export type DeleteProviderPhotoResult = { ok: true } | { error: string }

export async function deleteProviderPhoto(photoId: string): Promise<DeleteProviderPhotoResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to delete photos." }
  }

  const { data: row, error: selectError } = await supabase
    .from("provider_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("provider_profile_id", user.id)
    .single()

  if (selectError || !row) {
    return { error: selectError?.message ?? "Photo not found." }
  }

  const { error: deleteError } = await supabase
    .from("provider_photos")
    .delete()
    .eq("id", photoId)
    .eq("provider_profile_id", user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  try {
    const admin = getSupabaseAdminClient()
    await admin.storage.from(PROVIDER_PHOTOS_BUCKET).remove([row.storage_path])
  } catch {
    // Row already deleted; log and continue
  }

  revalidatePath("/dashboard/provider/photos")
  revalidatePath("/dashboard/provider")
  await revalidatePublicDirectoryAfterListingPhotosChange(user.id)
  return { ok: true }
}
