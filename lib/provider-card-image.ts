const PROVIDER_PHOTOS_BUCKET = "provider-photos"

/** Local placeholder when provider has no primary photo (avoids external domain restrictions). */
export const PLACEHOLDER_PROVIDER_IMAGE = "/images/placeholder-provider.svg"

function buildPhotoPublicUrl(storagePath: string, baseUrl: string): string {
  return `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${storagePath}`
}

/**
 * Card image URL for directory/search: **primary Supabase upload always wins** over Google Places.
 * If `primaryPath` is set (from `provider_photos.is_primary`), Google photo references are ignored.
 * Otherwise uses `/api/place-photo` when a Places `photo_reference` exists, else the local placeholder.
 */
export function buildProviderCardImageUrl(
  primaryPath: string | null,
  googlePhotoReference: string | null,
  baseUrl: string
): string {
  if (primaryPath) {
    return buildPhotoPublicUrl(primaryPath, baseUrl)
  }
  const ref = googlePhotoReference?.trim()
  if (ref) {
    return `/api/place-photo?${new URLSearchParams({
      photo_reference: ref,
      maxwidth: "800",
    }).toString()}`
  }
  return PLACEHOLDER_PROVIDER_IMAGE
}
