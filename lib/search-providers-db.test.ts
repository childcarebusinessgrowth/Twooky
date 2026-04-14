import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { filterActiveProviders, type ActiveProviderRow } from "./search-providers-db"

function buildRow(overrides: Partial<ActiveProviderRow> = {}): ActiveProviderRow {
  return {
    profile_id: "provider-1",
    provider_slug: "provider-1",
    business_name: "Provider One",
    city: "Dubai",
    address: "123 Main Street",
    latitude: 25.2048,
    longitude: 55.2708,
    google_place_id: null,
    description: "Quality childcare provider",
    provider_types: ["nursery"],
    age_groups_served: ["infant"],
    curriculum_type: ["Play-Based"],
    languages_spoken: "English",
    daily_fee_from: 100,
    daily_fee_to: 150,
    currencies: { symbol: "$" },
    primary_photo_storage_path: null,
    review_count: 3,
    avg_rating: 4.6,
    featured: false,
    early_learning_excellence_badge: false,
    verified_provider_badge: false,
    verified_provider_badge_color: null,
    availability_status: "openings",
    available_spots_count: 2,
    saved_by_parent_count: 0,
    country_code: "AE",
    google_cached_photo_storage_path: null,
    google_photo_reference: null,
    program_types: [],
    ...overrides,
  }
}

describe("filterActiveProviders", () => {
  it("matches providers within the requested radius", () => {
    const rows = [
      buildRow({ profile_id: "nearby", provider_slug: "nearby" }),
      buildRow({
        profile_id: "far-away",
        provider_slug: "far-away",
        latitude: 51.5072,
        longitude: -0.1276,
        city: "London",
      }),
    ]

    const result = filterActiveProviders(rows, {
      centerLat: 25.2048,
      centerLng: 55.2708,
      radiusKm: 10,
    })

    expect(result.map((row) => row.profile_id)).toEqual(["nearby"])
  })

  it("falls back to text location matching when a radius search row has no coordinates", () => {
    const rows = [
      buildRow({
        profile_id: "city-only",
        provider_slug: "city-only",
        city: "London",
        latitude: null,
        longitude: null,
      }),
    ]

    const result = filterActiveProviders(rows, {
      locationText: "London",
      centerLat: 51.5072,
      centerLng: -0.1276,
      radiusKm: 15,
    })

    expect(result.map((row) => row.profile_id)).toEqual(["city-only"])
  })

  it("matches free text against linked program types", () => {
    const rows = [
      buildRow({
        profile_id: "montessori",
        provider_slug: "montessori",
        program_types: [{ id: "1", name: "Montessori", slug: "montessori" }],
      }),
    ]

    const result = filterActiveProviders(rows, {
      queryText: "montessori",
    })

    expect(result.map((row) => row.profile_id)).toEqual(["montessori"])
  })
})
