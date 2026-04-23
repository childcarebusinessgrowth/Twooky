import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { GooglePlaceDetailsSummary } from "@/lib/google-place-reviews"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"
const MAX_GOOGLE_PHOTO_BYTES = 8 * 1024 * 1024
const inFlightByKey = new Map<string, Promise<string | null>>()

type EnsureCachedGoogleProviderPhotoInput = {
  providerProfileId: string
  placeId: string | null
  photoReference: string | null
}

type PersistGooglePlaceSummaryCacheInput = {
  providerProfileId: string
  placeId?: string | null
  summary: GooglePlaceDetailsSummary | null
}

export async function persistGooglePlaceSummaryCache(
  input: PersistGooglePlaceSummaryCacheInput
): Promise<boolean> {
  const providerProfileId = input.providerProfileId.trim()
  if (!providerProfileId || !input.summary) return false

  const updates: {
    google_place_id?: string
    google_photo_reference_cached?: string
    google_rating_cached?: number
    google_review_count_cached?: number
    google_reviews_url_cached?: string
    google_reviews_cached_at?: string
    latitude?: number
    longitude?: number
  } = {}

  const placeId = input.placeId?.trim() ?? ""
  if (placeId) {
    updates.google_place_id = placeId
  }
  const photoRef = input.summary.photoReference?.trim()
  if (photoRef) {
    updates.google_photo_reference_cached = photoRef
  }
  if (typeof input.summary.rating === "number" && Number.isFinite(input.summary.rating)) {
    updates.google_rating_cached = input.summary.rating
  }
  if (
    typeof input.summary.reviewCount === "number" &&
    Number.isFinite(input.summary.reviewCount)
  ) {
    updates.google_review_count_cached = input.summary.reviewCount
  }
  const reviewsUrl = input.summary.reviewsUrl?.trim()
  if (reviewsUrl) {
    updates.google_reviews_url_cached = reviewsUrl
  }

  const { latitude, longitude } = input.summary
  const hasValidCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  if (hasValidCoordinates) {
    updates.latitude = latitude
    updates.longitude = longitude
  }

  if (
    updates.google_rating_cached !== undefined ||
    updates.google_review_count_cached !== undefined ||
    updates.google_reviews_url_cached !== undefined
  ) {
    updates.google_reviews_cached_at = new Date().toISOString()
  }

  if (Object.keys(updates).length === 0) return false

  const admin = getSupabaseAdminClient()
  let { error } = await admin.from("provider_profiles").update(updates).eq("profile_id", providerProfileId)

  // Environments that haven't applied the latitude/longitude migration yet should still
  // persist the Google summary fields. Retry without the geo columns on "column does not exist".
  if (
    error &&
    (updates.latitude !== undefined || updates.longitude !== undefined) &&
    error.message?.toLowerCase().includes("column")
  ) {
    const { latitude: _latOmitted, longitude: _lngOmitted, ...updatesWithoutCoords } = updates
    void _latOmitted
    void _lngOmitted
    if (Object.keys(updatesWithoutCoords).length > 0) {
      const retry = await admin
        .from("provider_profiles")
        .update(updatesWithoutCoords)
        .eq("profile_id", providerProfileId)
      error = retry.error
    } else {
      error = null
    }
  }

  return !error
}

function fileExtensionFromContentType(contentType: string | null): string {
  const ct = (contentType ?? "").toLowerCase()
  if (ct.includes("png")) return "png"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("avif")) return "avif"
  return "jpg"
}

async function fetchGooglePhotoBlob(
  photoReference: string,
  apiKey: string
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?${new URLSearchParams({
    maxwidth: "800",
    photo_reference: photoReference,
    key: apiKey,
  })}`

  const response = await fetch(googleUrl, {
    method: "GET",
    cache: "no-store",
  }).catch(() => null)

  if (!response?.ok) return { bytes: new Uint8Array(0), contentType: "" }
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) return { bytes: new Uint8Array(0), contentType: "" }

  const buffer = await response.arrayBuffer().catch(() => null)
  if (!buffer || buffer.byteLength <= 0 || buffer.byteLength > MAX_GOOGLE_PHOTO_BYTES) {
    return { bytes: new Uint8Array(0), contentType: "" }
  }
  return { bytes: new Uint8Array(buffer), contentType }
}

/**
 * Persist Google Place photo once for a provider and return storage path.
 * Returns null when caching cannot be completed.
 */
export async function ensureCachedGoogleProviderPhoto(
  input: EnsureCachedGoogleProviderPhotoInput
): Promise<string | null> {
  const providerProfileId = input.providerProfileId.trim()
  const photoReference = input.photoReference?.trim() ?? ""
  if (!providerProfileId || !photoReference) return null

  const key = `${providerProfileId}|${photoReference}`
  const existing = inFlightByKey.get(key)
  if (existing) return existing

  const pending = (async (): Promise<string | null> => {
    const admin = getSupabaseAdminClient()

    const { data: current, error: readError } = await admin
      .from("provider_profiles")
      .select("google_fallback_storage_path")
      .eq("profile_id", providerProfileId)
      .maybeSingle()

    if (!readError) {
      const alreadyCached = current?.google_fallback_storage_path?.trim() ?? ""
      if (alreadyCached) return alreadyCached
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
    if (!apiKey) return null

    const downloaded = await fetchGooglePhotoBlob(photoReference, apiKey)
    if (downloaded.bytes.length === 0 || !downloaded.contentType) return null

    const ext = fileExtensionFromContentType(downloaded.contentType)
    const storagePath = `google-fallback/${providerProfileId}.${ext}`

    const { error: uploadError } = await admin.storage
      .from(PROVIDER_PHOTOS_BUCKET)
      .upload(storagePath, downloaded.bytes, {
        contentType: downloaded.contentType,
        cacheControl: "2592000",
        upsert: true,
      })
    if (uploadError) return null

    const updates: {
      google_fallback_storage_path: string
      google_photo_reference_cached: string
      google_fallback_cached_at: string
      google_place_id?: string
    } = {
      google_fallback_storage_path: storagePath,
      google_photo_reference_cached: photoReference,
      google_fallback_cached_at: new Date().toISOString(),
    }
    const placeId = input.placeId?.trim() ?? ""
    if (placeId) {
      updates.google_place_id = placeId
    }

    const { error: updateError } = await admin
      .from("provider_profiles")
      .update(updates)
      .eq("profile_id", providerProfileId)

    if (updateError) return null
    return storagePath
  })()

  inFlightByKey.set(key, pending)
  try {
    return await pending
  } finally {
    inFlightByKey.delete(key)
  }
}
