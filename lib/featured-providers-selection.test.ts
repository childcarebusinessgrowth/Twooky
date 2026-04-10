import { describe, expect, it } from "vitest"
import { __test, filterProvidersByVisitorGeo, selectFeaturedProviders } from "./featured-providers-selection"
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
    daily_fee_from: p.daily_fee_from ?? null,
    daily_fee_to: p.daily_fee_to ?? null,
    currencies: p.currencies ?? null,
    primary_photo_storage_path: p.primary_photo_storage_path ?? null,
    google_photo_reference: p.google_photo_reference ?? null,
    review_count: p.review_count ?? 0,
    avg_rating: p.avg_rating ?? null,
    featured: p.featured ?? true,
    availability_status: p.availability_status ?? null,
    available_spots_count: p.available_spots_count ?? null,
    early_learning_excellence_badge: p.early_learning_excellence_badge ?? false,
    verified_provider_badge: p.verified_provider_badge ?? false,
    verified_provider_badge_color: p.verified_provider_badge_color ?? "emerald",
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

describe("filterProvidersByVisitorGeo", () => {
  it("returns [] when visitorGeo is null", () => {
    const rows = [row({ profile_id: "1", featured: false, country_code: "UAE" })]
    expect(filterProvidersByVisitorGeo(rows, null)).toEqual([])
  })

  it("excludes providers outside a small radius when radiusKm is set", () => {
    const dubaiCenter = { latitude: 25.2048, longitude: 55.2708, city: "Dubai", countryCode: "UAE" }
    const nearDubai = row({
      profile_id: "near",
      latitude: 25.21,
      longitude: 55.28,
      country_code: "UAE",
      featured: false,
    })
    const london = row({
      profile_id: "far",
      latitude: 51.5074,
      longitude: -0.1278,
      country_code: "UK",
      featured: false,
      avg_rating: 5,
    })
    const pool = [nearDubai, london]
    const tight = filterProvidersByVisitorGeo(pool, dubaiCenter, { radiusKm: 8.05 })
    expect(tight.map((p) => p.profile_id)).toEqual(["near"])
  })

  it("includes all rows in country when distance and city do not match", () => {
    const geo = { latitude: null, longitude: null, city: null, countryCode: "UAE" }
    const a = row({ profile_id: "a", country_code: "UAE", avg_rating: 4, featured: false })
    const b = row({ profile_id: "b", country_code: "UK", featured: false })
    const picked = filterProvidersByVisitorGeo([a, b], geo)
    expect(picked.map((p) => p.profile_id)).toEqual(["a"])
  })

  it("preferCityFirst returns same-city rows before distance, even if listings are outside a small radius", () => {
    const geo = { latitude: 25.0, longitude: 55.0, city: "Dubai", countryCode: "UAE" }
    const inCityFar = row({
      profile_id: "dubai",
      city: "Dubai",
      latitude: 25.45,
      longitude: 55.55,
      country_code: "UAE",
      featured: false,
    })
    const nearButOtherCity = row({
      profile_id: "near",
      city: "Sharjah",
      latitude: 25.01,
      longitude: 55.01,
      country_code: "UAE",
      featured: false,
    })
    const picked = filterProvidersByVisitorGeo([inCityFar, nearButOtherCity], geo, {
      preferCityFirst: true,
      radiusKm: 5,
      distanceRadiusKm: 5,
    })
    expect(picked.map((p) => p.profile_id)).toEqual(["dubai"])
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
