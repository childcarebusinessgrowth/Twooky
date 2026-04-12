import type { GooglePlaceDetailsSummary } from "@/lib/google-place-reviews"

const GOOGLE_REVIEWS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type ProviderGoogleCacheRow = {
  google_rating_cached?: number | null
  google_review_count_cached?: number | null
  google_reviews_url_cached?: string | null
  google_reviews_cached_at?: string | null
  google_photo_reference_cached?: string | null
}

export function isGoogleReviewCacheFresh(cachedAt: string | null | undefined): boolean {
  const raw = cachedAt?.trim()
  if (!raw) return false
  const parsedMs = Date.parse(raw)
  if (!Number.isFinite(parsedMs)) return false
  return Date.now() - parsedMs < GOOGLE_REVIEWS_CACHE_TTL_MS
}

export function readCachedGooglePlaceSummary(row: ProviderGoogleCacheRow): GooglePlaceDetailsSummary | null {
  const out: GooglePlaceDetailsSummary = {}
  if (typeof row.google_rating_cached === "number" && Number.isFinite(row.google_rating_cached)) {
    out.rating = row.google_rating_cached
  }
  if (
    typeof row.google_review_count_cached === "number" &&
    Number.isFinite(row.google_review_count_cached)
  ) {
    out.reviewCount = row.google_review_count_cached
  }
  const reviewsUrl = row.google_reviews_url_cached?.trim()
  if (reviewsUrl) {
    out.reviewsUrl = reviewsUrl
  }
  const photoRef = row.google_photo_reference_cached?.trim()
  if (photoRef) {
    out.photoReference = photoRef
  }
  return Object.keys(out).length > 0 ? out : null
}

export function hasFreshCachedGoogleReviews(row: ProviderGoogleCacheRow): boolean {
  const hasReviewValue =
    (typeof row.google_rating_cached === "number" && Number.isFinite(row.google_rating_cached)) ||
    (typeof row.google_review_count_cached === "number" &&
      Number.isFinite(row.google_review_count_cached)) ||
    Boolean(row.google_reviews_url_cached?.trim())
  return hasReviewValue && isGoogleReviewCacheFresh(row.google_reviews_cached_at)
}
