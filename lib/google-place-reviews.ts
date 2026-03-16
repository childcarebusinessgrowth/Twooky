import "server-only"

type GooglePlaceDetailsResponse = {
  status?: string
  error_message?: string
  result?: {
    rating?: number
    user_ratings_total?: number
    url?: string
    geometry?: {
      location?: {
        lat?: number
        lng?: number
      }
    }
  }
}

export type GooglePlaceReviewSummary = {
  rating: number
  reviewCount: number
  reviewsUrl: string
  latitude?: number
  longitude?: number
}

/**
 * Fetches Google rating + review count for a place.
 * Returns null when place or API response is unavailable.
 */
export async function fetchGooglePlaceReviewSummary(
  placeId: string | null | undefined,
  apiKey: string | undefined
): Promise<GooglePlaceReviewSummary | null> {
  const trimmedPlaceId = placeId?.trim()
  if (!trimmedPlaceId || !apiKey?.trim()) return null

  const query = new URLSearchParams({
    placeid: trimmedPlaceId,
    fields: "rating,user_ratings_total,url,geometry/location",
    key: apiKey,
  })

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  ).catch(() => null)

  if (!response || !response.ok) return null

  const payload = (await response.json()) as GooglePlaceDetailsResponse
  if (payload.status !== "OK") return null

  const rating = payload.result?.rating
  const reviewCount = payload.result?.user_ratings_total
  const reviewsUrl = payload.result?.url
  const latitude = payload.result?.geometry?.location?.lat
  const longitude = payload.result?.geometry?.location?.lng

  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    typeof reviewCount !== "number" ||
    !Number.isFinite(reviewCount) ||
    typeof reviewsUrl !== "string" ||
    !reviewsUrl.trim()
  ) {
    return null
  }

  return {
    rating,
    reviewCount,
    reviewsUrl,
    ...(typeof latitude === "number" && Number.isFinite(latitude) ? { latitude } : {}),
    ...(typeof longitude === "number" && Number.isFinite(longitude) ? { longitude } : {}),
  }
}
