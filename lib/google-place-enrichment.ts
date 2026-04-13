import "server-only"

import { ensureCachedGoogleProviderPhoto, persistGooglePlaceSummaryCache } from "@/lib/cache-google-provider-photo"
import { resolveGooglePlaceIdFromText } from "@/lib/google-place-id"
import { fetchGooglePlaceDetailsSummary } from "@/lib/google-place-reviews"

export type EnrichProviderGooglePlaceCacheInput = {
  providerProfileId: string
  businessName?: string | null
  address?: string | null
  placeId?: string | null
  hasPrimaryPhoto?: boolean
  logContext?: string
}

export type EnrichProviderGooglePlaceCacheResult = {
  ok: boolean
  placeId: string | null
  persisted: boolean
  cachedPhotoPath: string | null
}

function getGoogleMapsApiKey(): string | null {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  return apiKey || null
}

export async function enrichProviderGooglePlaceCache(
  input: EnrichProviderGooglePlaceCacheInput
): Promise<EnrichProviderGooglePlaceCacheResult> {
  const providerProfileId = input.providerProfileId.trim()
  if (!providerProfileId) {
    return { ok: false, placeId: null, persisted: false, cachedPhotoPath: null }
  }

  const businessName = input.businessName?.trim() ?? ""
  const address = input.address?.trim() ?? ""
  const context = input.logContext?.trim() || "google-enrichment"

  let placeId = input.placeId?.trim() ?? ""
  if (!placeId && businessName && address) {
    try {
      placeId = (await resolveGooglePlaceIdFromText(businessName, address))?.trim() ?? ""
    } catch (error) {
      console.warn(`[${context}] place-id resolution failed`, error)
    }
  }

  if (!placeId) {
    return { ok: false, placeId: null, persisted: false, cachedPhotoPath: null }
  }

  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return { ok: false, placeId, persisted: false, cachedPhotoPath: null }
  }

  try {
    const summary = await fetchGooglePlaceDetailsSummary(placeId, apiKey)
    if (!summary) {
      return { ok: false, placeId, persisted: false, cachedPhotoPath: null }
    }

    const persisted = await persistGooglePlaceSummaryCache({
      providerProfileId,
      placeId,
      summary,
    })

    let cachedPhotoPath: string | null = null
    if (!input.hasPrimaryPhoto && summary.photoReference) {
      cachedPhotoPath = await ensureCachedGoogleProviderPhoto({
        providerProfileId,
        placeId,
        photoReference: summary.photoReference,
      })
    }

    return { ok: true, placeId, persisted, cachedPhotoPath }
  } catch (error) {
    console.warn(`[${context}] enrichment failed`, error)
    return { ok: false, placeId, persisted: false, cachedPhotoPath: null }
  }
}
