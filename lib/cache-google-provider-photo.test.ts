import { afterEach, describe, expect, it, vi } from "vitest"
import {
  hasFreshCachedGoogleReviews,
  isGoogleReviewCacheFresh,
  readCachedGooglePlaceSummary,
} from "@/lib/google-place-cache"

describe("google review cache freshness", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("treats cache within 7 days as fresh", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T12:00:00.000Z").getTime())
    expect(isGoogleReviewCacheFresh("2026-04-10T12:00:00.000Z")).toBe(true)
  })

  it("treats cache older than 7 days as stale", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T12:00:00.000Z").getTime())
    expect(isGoogleReviewCacheFresh("2026-04-04T11:59:59.000Z")).toBe(false)
  })

  it("requires both fresh timestamp and at least one review field", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-12T12:00:00.000Z").getTime())

    expect(
      hasFreshCachedGoogleReviews({
        google_reviews_cached_at: "2026-04-11T12:00:00.000Z",
      })
    ).toBe(false)

    expect(
      hasFreshCachedGoogleReviews({
        google_rating_cached: 4.8,
        google_reviews_cached_at: "2026-04-11T12:00:00.000Z",
      })
    ).toBe(true)
  })
})

describe("readCachedGooglePlaceSummary", () => {
  it("maps cached fields into Google summary shape", () => {
    expect(
      readCachedGooglePlaceSummary({
        google_rating_cached: 4.9,
        google_review_count_cached: 127,
        google_reviews_url_cached: "https://maps.google.com/example",
        google_photo_reference_cached: "photo_ref_123",
      })
    ).toEqual({
      rating: 4.9,
      reviewCount: 127,
      reviewsUrl: "https://maps.google.com/example",
      photoReference: "photo_ref_123",
    })
  })
})
