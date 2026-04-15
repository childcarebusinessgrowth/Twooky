import "server-only"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"

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
    photos?: Array<{
      photo_reference?: string
    }>
  }
}

/** Partial Google Place Details used for listings (ratings, map, first photo). */
export type GooglePlaceDetailsSummary = {
  rating?: number
  reviewCount?: number
  reviewsUrl?: string
  latitude?: number
  longitude?: number
  /** First Places photo reference for Place Photo API. */
  photoReference?: string
}

/** @deprecated Use GooglePlaceDetailsSummary */
export type GooglePlaceReviewSummary = GooglePlaceDetailsSummary

/**
 * Fetches Google Place Details: ratings, reviews link, geometry, and first photo reference.
 * Returns a partial object when `status === "OK"` with whatever fields are present.
 * Returns null when the place or API response is unavailable.
 */
export async function fetchGooglePlaceDetailsSummary(
  placeId: string | null | undefined,
  apiKey: string | undefined
): Promise<GooglePlaceDetailsSummary | null> {
  const trimmedPlaceId = placeId?.trim()
  if (!trimmedPlaceId || !apiKey?.trim()) return null

  const query = new URLSearchParams({
    placeid: trimmedPlaceId,
    fields: "rating,user_ratings_total,url,geometry/location,photos",
    key: apiKey,
  })

  const response = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/place/details/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
    10_000,
  ).catch(() => null)

  if (!response || !response.ok) return null

  const payload = (await response.json()) as GooglePlaceDetailsResponse
  if (payload.status !== "OK" || !payload.result) {
    if (process.env.NODE_ENV === "development" && payload.status && payload.status !== "OK") {
      console.warn(
        "[google-place-details]",
        payload.status,
        payload.error_message ?? "(no message)",
      )
    }
    return null
  }

  const result = payload.result
  const rating = result.rating
  const reviewCount = result.user_ratings_total
  const reviewsUrl = result.url
  const latitude = result.geometry?.location?.lat
  const longitude = result.geometry?.location?.lng
  const photoRef = result.photos?.[0]?.photo_reference?.trim()

  const out: GooglePlaceDetailsSummary = {}

  if (typeof rating === "number" && Number.isFinite(rating)) {
    out.rating = rating
  }
  if (typeof reviewCount === "number" && Number.isFinite(reviewCount)) {
    out.reviewCount = reviewCount
  }
  if (typeof reviewsUrl === "string" && reviewsUrl.trim()) {
    out.reviewsUrl = reviewsUrl.trim()
  }
  if (typeof latitude === "number" && Number.isFinite(latitude)) {
    out.latitude = latitude
  }
  if (typeof longitude === "number" && Number.isFinite(longitude)) {
    out.longitude = longitude
  }
  if (photoRef) {
    out.photoReference = photoRef
  }

  if (Object.keys(out).length === 0) {
    return null
  }

  return out
}

/** @deprecated Use fetchGooglePlaceDetailsSummary */
export const fetchGooglePlaceReviewSummary = fetchGooglePlaceDetailsSummary
