import { describe, expect, it } from "vitest"
import { __test, selectFeaturedProviders } from "./featured-providers-selection"
import type { ActiveProviderRow } from "./search-providers-db"

function row(p: Partial<ActiveProviderRow> & { profile_id: string }): ActiveProviderRow {
  return {
    profile_id: p.profile_id,
    provider_slug: p.provider_slug ?? "slug",
    business_name: p.business_name ?? "Biz",
    city: p.city ?? null,
    address: p.address ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    google_place_id: p.google_place_id ?? null,
    description: p.description ?? null,
    provider_types: p.provider_types ?? null,
    age_groups_served: p.age_groups_served ?? null,
    curriculum_type: p.curriculum_type ?? null,
    languages_spoken: p.languages_spoken ?? null,
    monthly_tuition_from: p.monthly_tuition_from ?? null,
    monthly_tuition_to: p.monthly_tuition_to ?? null,
    currencies: p.currencies ?? null,
    primary_photo_storage_path: p.primary_photo_storage_path ?? null,
    review_count: p.review_count ?? 0,
    avg_rating: p.avg_rating ?? null,
    featured: p.featured ?? true,
    saved_by_parent_count: p.saved_by_parent_count ?? 0,
    country_code: p.country_code ?? null,
  }
}

describe("haversineKm", () => {
  it("returns a small distance for nearby London coordinates", () => {
    const km = __test.haversineKm(51.5074, -0.1278, 51.52, -0.1)
    expect(km).toBeGreaterThan(0)
    expect(km).toBeLessThan(25)
  })
})

describe("cityMatchesVisitor", () => {
  it("matches when city names overlap and countries align", () => {
    const r = row({
      profile_id: "1",
      city: "London",
      country_code: "GB",
    })
    expect(__test.cityMatchesVisitor(r, "London", "GB")).toBe(true)
  })

  it("rejects same city name when country codes conflict", () => {
    const r = row({
      profile_id: "1",
      city: "London",
      country_code: "CA",
    })
    expect(__test.cityMatchesVisitor(r, "London", "GB")).toBe(false)
  })
})

describe("selectFeaturedProviders", () => {
  it("returns local providers sorted by rating when distance matches", () => {
    const london = { latitude: 51.5074, longitude: -0.1278, city: null, countryCode: null }
    const rows = [
      row({
        profile_id: "a",
        latitude: 51.51,
        longitude: -0.13,
        avg_rating: 4,
        featured: true,
      }),
      row({
        profile_id: "b",
        latitude: 51.52,
        longitude: -0.11,
        avg_rating: 5,
        featured: true,
      }),
    ]
    const picked = selectFeaturedProviders(rows, {
      visitorGeo: london,
      limit: 2,
    })
    expect(picked.map((x) => x.profile_id)).toEqual(["b", "a"])
  })

  it("uses random fallback when geo is null (deterministic random fn)", () => {
    const rows = [
      row({ profile_id: "x", featured: true }),
      row({ profile_id: "y", featured: true }),
      row({ profile_id: "z", featured: true }),
    ]
    const picked = selectFeaturedProviders(rows, {
      visitorGeo: null,
      limit: 3,
      random: () => 0,
    })
    expect(picked).toHaveLength(3)
    expect(new Set(picked.map((p) => p.profile_id)).size).toBe(3)
  })

  it("ignores non-featured rows", () => {
    const rows = [row({ profile_id: "only", featured: true })]
    const noise = row({ profile_id: "n", featured: false })
    const picked = selectFeaturedProviders([...rows, noise], {
      visitorGeo: null,
      limit: 5,
      random: () => 0.5,
    })
    expect(picked.every((p) => p.featured)).toBe(true)
  })

  it("scopes by age tags when provided, then falls back to all featured for random", () => {
    const infantFeatured = row({
      profile_id: "inf",
      featured: true,
      age_groups_served: ["infant"],
    })
    const preschoolFeatured = row({
      profile_id: "pre",
      featured: true,
      age_groups_served: ["preschool"],
    })
    const picked = selectFeaturedProviders([infantFeatured, preschoolFeatured], {
      visitorGeo: null,
      limit: 1,
      ageTags: ["infant"],
      random: () => 0.99,
    })
    expect(picked).toHaveLength(1)
    expect(picked[0]!.profile_id).toBe("inf")
  })
})
