import { unstable_cache } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SearchCriteria } from "./search-providers"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { PROVIDER_TYPES, type ProviderTypeId } from "./provider-types"
import { fetchGooglePlaceDetailsSummary, type GooglePlaceDetailsSummary } from "./google-place-reviews"
import { resolveGooglePlaceIdFromText } from "./google-place-id"
import { geocodeAddressToCoordinates } from "./geocode-server"
import { formatDailyFeeRange } from "./currency"
import { getProgramTypeBySlug, getAgeGroupsById } from "./program-types"
import { getSupabaseAdminClient } from "./supabaseAdmin"
import {
  filterProvidersByVisitorGeo,
  matchesAgeTags as rowMatchesFeaturedAgeTags,
  selectFeaturedProviders,
} from "./featured-providers-selection"
import type { VisitorGeo } from "./visitor-geo"
import { buildProviderCardImageUrl } from "./provider-card-image"

export type ActiveProviderRow = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  description: string | null
  provider_types: string[] | null
  age_groups_served: string[] | null
  curriculum_type: string[] | null
  languages_spoken: string | null
  daily_fee_from: number | null
  daily_fee_to: number | null
  currencies?: { symbol?: string } | null
  primary_photo_storage_path: string | null
  review_count: number
  avg_rating: number | null
  featured: boolean
  early_learning_excellence_badge: boolean
  verified_provider_badge: boolean
  verified_provider_badge_color: string | null
  availability_status: "openings" | "waitlist" | "full" | null
  available_spots_count: number | null
  saved_by_parent_count: number
  /** ISO 3166-1 alpha-2 from `countries.code` when `country_id` is set */
  country_code: string | null
  /** First Places API photo ref when no primary upload; used with `/api/place-photo`. */
  google_photo_reference: string | null
}

export type ProviderCardDataFromDb = {
  id: string
  slug: string
  name: string
  rating: number
  reviewCount: number
  location: string
  priceRange: string
  providerTypes: ProviderTypeId[]
  programTypes: string[]
  shortDescription: string
  image: string
  latitude: number
  longitude: number
  address: string
  featured?: boolean
  earlyLearningExcellenceBadge?: boolean
  verifiedProviderBadge?: boolean
  verifiedProviderBadgeColor?: string | null
  savedByParentCount: number
}

const VALID_PROVIDER_TYPE_IDS = new Set<ProviderTypeId>(PROVIDER_TYPES.map((type) => type.id))

function toProviderTypeIds(values: string[] | null): ProviderTypeId[] {
  if (!values?.length) return []
  return values.filter((value): value is ProviderTypeId => VALID_PROVIDER_TYPE_IDS.has(value as ProviderTypeId))
}

export async function getActiveProvidersFromDb(
  supabase: SupabaseClient
): Promise<ActiveProviderRow[]> {
  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { data: profiles, error: profilesError } = await supabase
    .from("provider_profiles")
    .select(
      "profile_id, provider_slug, business_name, city, address, google_place_id, description, provider_types, age_groups_served, curriculum_type, languages_spoken, daily_fee_from, daily_fee_to, currency_id, currencies(symbol), featured, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count, country_id, countries(code)"
    )
    .eq("listing_status", "active")
    .not("provider_slug", "is", null)

  if (profilesError || !profiles?.length) return []

  const profileIds = profiles.map((p) => p.profile_id)

  const [photosResult, reviewsResult, favoritesResult] = await Promise.all([
    supabase
      .from("provider_photos")
      .select("provider_profile_id, storage_path")
      .in("provider_profile_id", profileIds)
      .eq("is_primary", true),
    supabase
      .from("parent_reviews")
      .select("provider_profile_id, rating")
      .in("provider_profile_id", profileIds),
    supabase
      .from("parent_favorites")
      .select("provider_profile_id, parent_profile_id")
      .in("provider_profile_id", profileIds),
  ])

  const primaryPhotoByProfile: Record<string, string> = {}
  ;(photosResult.data ?? []).forEach((row) => {
    primaryPhotoByProfile[row.provider_profile_id] = row.storage_path
  })

  const reviewStatsByProfile: Record<string, { count: number; sum: number }> = {}
  ;(reviewsResult.data ?? []).forEach((row) => {
    const cur = reviewStatsByProfile[row.provider_profile_id] ?? { count: 0, sum: 0 }
    cur.count += 1
    cur.sum += row.rating
    reviewStatsByProfile[row.provider_profile_id] = cur
  })

  const seenByProvider: Record<string, Set<string>> = {}
  ;(favoritesResult.data ?? []).forEach((row) => {
    const providerId = row.provider_profile_id
    const parentId = row.parent_profile_id
    if (!providerId || !parentId) return
    if (!seenByProvider[providerId]) seenByProvider[providerId] = new Set()
    seenByProvider[providerId].add(parentId)
  })
  const savedByParentCountByProfile: Record<string, number> = {}
  for (const [providerId, parents] of Object.entries(seenByProvider)) {
    savedByParentCountByProfile[providerId] = parents.size
  }

  const googleSummaryByProfile: Record<string, GooglePlaceDetailsSummary | null> = {}
  const findPlaceByKey = new Map<string, Promise<string | null>>()
  const geocodeByAddress = new Map<string, Promise<{ lat: number; lng: number } | null>>()

  const getGeocodedCoords = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const normalizedAddress = address.trim()
    if (!normalizedAddress || !googleApiKey?.trim()) return null

    const existing = geocodeByAddress.get(normalizedAddress)
    if (existing) return existing

    const pending = geocodeAddressToCoordinates(normalizedAddress, googleApiKey)
    geocodeByAddress.set(normalizedAddress, pending)
    return pending
  }

  const resolvePlaceIdFromTextCached = (name: string, addressLine: string): Promise<string | null> => {
    const key = `${name.toLowerCase()}|${addressLine.toLowerCase()}`
    let pending = findPlaceByKey.get(key)
    if (!pending) {
      pending = resolveGooglePlaceIdFromText(name, addressLine)
      findPlaceByKey.set(key, pending)
    }
    return pending
  }

  const coordsByProfile: Record<string, { lat: number; lng: number } | null> = {}
  await Promise.all(
    profiles.map(async (profile) => {
      const hasPrimary = Boolean(primaryPhotoByProfile[profile.profile_id])
      const name = profile.business_name?.trim() ?? ""
      const addressLine = [profile.address, profile.city].filter(Boolean).join(", ").trim()

      let placeId = (profile.google_place_id as string | null | undefined)?.trim() || null
      if (!placeId && !hasPrimary && name && addressLine) {
        placeId = await resolvePlaceIdFromTextCached(name, addressLine)
      }

      let summary = await fetchGooglePlaceDetailsSummary(placeId, googleApiKey)

      // Stored place_id may be wrong or have no Places photos; try text resolution for photo only.
      if (!hasPrimary && name && addressLine && !summary?.photoReference) {
        const textPlaceId = await resolvePlaceIdFromTextCached(name, addressLine)
        if (textPlaceId && textPlaceId !== placeId) {
          const alt = await fetchGooglePlaceDetailsSummary(textPlaceId, googleApiKey)
          if (alt?.photoReference) {
            summary = { ...(summary ?? {}), photoReference: alt.photoReference }
          }
        }
      }

      googleSummaryByProfile[profile.profile_id] = summary

      if (
        typeof summary?.latitude === "number" &&
        Number.isFinite(summary.latitude) &&
        typeof summary?.longitude === "number" &&
        Number.isFinite(summary.longitude)
      ) {
        coordsByProfile[profile.profile_id] = {
          lat: summary.latitude,
          lng: summary.longitude,
        }
        return
      }

      const geocodeInput = [profile.address, profile.city].filter(Boolean).join(", ")
      if (!geocodeInput.trim()) {
        coordsByProfile[profile.profile_id] = null
        return
      }

      coordsByProfile[profile.profile_id] = await getGeocodedCoords(geocodeInput)
    })
  )

  return profiles.map((p) => {
    const stats = reviewStatsByProfile[p.profile_id]
    const platformCount = stats?.count ?? 0
    const platformAvgRating = stats && platformCount > 0 ? stats.sum / platformCount : null
    const googleSummary = googleSummaryByProfile[p.profile_id]
    const count = googleSummary?.reviewCount ?? platformCount
    const avgRating = googleSummary?.rating ?? platformAvgRating
    const googlePhotoRef = googleSummary?.photoReference ?? null

    const countriesRel = (p as { countries?: { code?: string } | null }).countries
    const countryCode =
      countriesRel && typeof countriesRel.code === "string" && countriesRel.code.trim()
        ? countriesRel.code.trim().toUpperCase()
        : null

    return {
      profile_id: p.profile_id,
      provider_slug: p.provider_slug,
      business_name: p.business_name,
      city: p.city,
      address: p.address,
      latitude: coordsByProfile[p.profile_id]?.lat ?? null,
      longitude: coordsByProfile[p.profile_id]?.lng ?? null,
      google_place_id: p.google_place_id,
      description: p.description,
      provider_types: p.provider_types,
      age_groups_served: p.age_groups_served,
      curriculum_type: p.curriculum_type,
      languages_spoken: p.languages_spoken,
      daily_fee_from: p.daily_fee_from,
      daily_fee_to: p.daily_fee_to,
      currencies: (p as { currencies?: { symbol?: string } | null }).currencies ?? null,
      primary_photo_storage_path: primaryPhotoByProfile[p.profile_id] ?? null,
      review_count: count,
      avg_rating: avgRating,
      featured: (p as { featured?: boolean }).featured ?? false,
      early_learning_excellence_badge:
        (p as { early_learning_excellence_badge?: boolean })
          .early_learning_excellence_badge ?? false,
      verified_provider_badge:
        (p as { verified_provider_badge?: boolean }).verified_provider_badge ?? false,
      verified_provider_badge_color:
        (p as { verified_provider_badge_color?: string | null }).verified_provider_badge_color ?? "emerald",
      availability_status:
        (p as { availability_status?: "openings" | "waitlist" | "full" | null }).availability_status ?? "openings",
      available_spots_count: (p as { available_spots_count?: number | null }).available_spots_count ?? null,
      saved_by_parent_count: savedByParentCountByProfile[p.profile_id] ?? 0,
      country_code: countryCode,
      google_photo_reference: googlePhotoRef,
    }
  })
}

/**
 * Cached active directory rows for public pages. Invalidated with
 * `revalidateActiveProvidersDirectoryCache()` when listings or card-visible fields change.
 */
export async function getActiveProvidersFromDbCached(): Promise<ActiveProviderRow[]> {
  return readActiveProvidersFromDbCached()
}

const readActiveProvidersFromDbCached = unstable_cache(
  async () => getActiveProvidersFromDb(getSupabaseAdminClient()),
  ["directory-active-providers-v2-google-photos"],
  { revalidate: 600, tags: [CACHE_TAGS.activeProviders] },
)

type HomeFeaturedProfileRow = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
  address: string | null
  description: string | null
  provider_types: string[] | null
  age_groups_served: string[] | null
  daily_fee_from: number | null
  daily_fee_to: number | null
  currencies?: { symbol?: string } | null
  early_learning_excellence_badge: boolean | null
  verified_provider_badge: boolean | null
  verified_provider_badge_color: string | null
  google_place_id: string | null
}

/**
 * Lightweight home query that avoids the full directory aggregation path.
 * Home only needs a few featured cards, so we fetch a narrow payload here.
 */
export async function getHomeFeaturedProvidersCached(limit = 3): Promise<ProviderCardDataFromDb[]> {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdminClient()
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

      const { data: profiles, error: profilesError } = await supabase
        .from("provider_profiles")
        .select(
          "profile_id, provider_slug, business_name, city, address, description, provider_types, age_groups_served, daily_fee_from, daily_fee_to, currencies(symbol), early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, google_place_id",
        )
        .eq("listing_status", "active")
        .eq("featured", true)
        .not("provider_slug", "is", null)
        .limit(limit)

      if (profilesError || !profiles?.length) {
        if (profilesError) {
          console.error("[home-featured] Failed lightweight featured provider query", profilesError.message)
        }
        return []
      }

      const profileIds = profiles.map((row) => row.profile_id)
      const googleApiKey =
        process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const [{ data: photos }, reviewsResult, favoritesResult] = await Promise.all([
        supabase
          .from("provider_photos")
          .select("provider_profile_id, storage_path")
          .in("provider_profile_id", profileIds)
          .eq("is_primary", true),
        supabase
          .from("parent_reviews")
          .select("provider_profile_id, rating")
          .in("provider_profile_id", profileIds),
        supabase
          .from("parent_favorites")
          .select("provider_profile_id, parent_profile_id")
          .in("provider_profile_id", profileIds),
      ])

      const photoByProfileId: Record<string, string> = {}
      ;(photos ?? []).forEach((row) => {
        photoByProfileId[row.provider_profile_id] = row.storage_path
      })

      const reviewStatsByProfile: Record<string, { count: number; sum: number }> = {}
      ;(reviewsResult.data ?? []).forEach((r) => {
        const cur = reviewStatsByProfile[r.provider_profile_id] ?? { count: 0, sum: 0 }
        cur.count += 1
        cur.sum += r.rating
        reviewStatsByProfile[r.provider_profile_id] = cur
      })

      const seenByProvider: Record<string, Set<string>> = {}
      ;(favoritesResult.data ?? []).forEach((row) => {
        const providerId = row.provider_profile_id
        const parentId = row.parent_profile_id
        if (!providerId || !parentId) return
        if (!seenByProvider[providerId]) seenByProvider[providerId] = new Set()
        seenByProvider[providerId].add(parentId)
      })
      const savedByParentCountByProfile: Record<string, number> = {}
      for (const [providerId, parents] of Object.entries(seenByProvider)) {
        savedByParentCountByProfile[providerId] = parents.size
      }

      const googleSummaryByProfile: Record<string, GooglePlaceDetailsSummary | null> = {}
      const findPlaceByKey = new Map<string, Promise<string | null>>()
      const resolvePlaceIdFromTextCachedHome = (name: string, addressLine: string): Promise<string | null> => {
        const key = `${name.toLowerCase()}|${addressLine.toLowerCase()}`
        let pending = findPlaceByKey.get(key)
        if (!pending) {
          pending = resolveGooglePlaceIdFromText(name, addressLine)
          findPlaceByKey.set(key, pending)
        }
        return pending
      }
      await Promise.all(
        (profiles as HomeFeaturedProfileRow[]).map(async (profile) => {
          const hasPrimary = Boolean(photoByProfileId[profile.profile_id])
          const name = profile.business_name?.trim() ?? ""
          const addressLine = [profile.address, profile.city].filter(Boolean).join(", ").trim()

          let placeId = profile.google_place_id?.trim() || null
          if (!placeId && !hasPrimary && name && addressLine) {
            placeId = await resolvePlaceIdFromTextCachedHome(name, addressLine)
          }

          let summary = await fetchGooglePlaceDetailsSummary(placeId, googleApiKey)

          if (!hasPrimary && name && addressLine && !summary?.photoReference) {
            const textPlaceId = await resolvePlaceIdFromTextCachedHome(name, addressLine)
            if (textPlaceId && textPlaceId !== placeId) {
              const alt = await fetchGooglePlaceDetailsSummary(textPlaceId, googleApiKey)
              if (alt?.photoReference) {
                summary = { ...(summary ?? {}), photoReference: alt.photoReference }
              }
            }
          }

          googleSummaryByProfile[profile.profile_id] = summary
        })
      )

      return (profiles as HomeFeaturedProfileRow[]).map((row) => {
        const slug = row.provider_slug ?? row.profile_id
        const symbol = (row.currencies as { symbol?: string } | null)?.symbol ?? "$"
        const googleSummary = googleSummaryByProfile[row.profile_id]
        const image = buildProviderCardImageUrl(
          photoByProfileId[row.profile_id] ?? null,
          googleSummary?.photoReference ?? null,
          baseUrl
        )

        const stats = reviewStatsByProfile[row.profile_id]
        const platformCount = stats?.count ?? 0
        const platformAvgRating =
          stats && platformCount > 0 ? stats.sum / platformCount : null
        const reviewCount = googleSummary?.reviewCount ?? platformCount
        const avgRating = googleSummary?.rating ?? platformAvgRating
        const rating = avgRating ?? 0
        const lat = googleSummary?.latitude
        const lng = googleSummary?.longitude

        return {
          id: row.profile_id,
          slug,
          name: row.business_name ?? "Provider",
          rating,
          reviewCount,
          location: [row.city, row.address].filter(Boolean).join(", ") || ",",
          priceRange: formatDailyFeeRange(row.daily_fee_from, row.daily_fee_to, symbol),
          providerTypes: toProviderTypeIds(row.provider_types),
          programTypes: ageGroupsToProgramLabels(row.age_groups_served),
          shortDescription: (row.description ?? "").slice(0, 200),
          image,
          latitude: typeof lat === "number" && Number.isFinite(lat) ? lat : 0,
          longitude: typeof lng === "number" && Number.isFinite(lng) ? lng : 0,
          address: row.address ?? "",
          featured: true,
          earlyLearningExcellenceBadge: row.early_learning_excellence_badge ?? false,
          verifiedProviderBadge: row.verified_provider_badge ?? false,
          verifiedProviderBadgeColor: row.verified_provider_badge_color ?? "emerald",
          savedByParentCount: savedByParentCountByProfile[row.profile_id] ?? 0,
        }
      })
    },
    ["home-featured-providers-v5-google-photos", String(limit)],
    { revalidate: 600, tags: [CACHE_TAGS.activeProviders] },
  )()
}

function matchesLocation(row: ActiveProviderRow, locationText?: string): boolean {
  if (!locationText?.trim()) return true
  const q = locationText.toLowerCase()
  const city = (row.city ?? "").toLowerCase()
  const address = (row.address ?? "").toLowerCase()
  return city.includes(q) || address.includes(q)
}

function matchesQuery(row: ActiveProviderRow, queryText?: string): boolean {
  if (!queryText?.trim()) return true
  const q = queryText.toLowerCase()
  const name = (row.business_name ?? "").toLowerCase()
  const desc = (row.description ?? "").toLowerCase()
  const city = (row.city ?? "").toLowerCase()
  const address = (row.address ?? "").toLowerCase()
  const types = (row.provider_types ?? []).join(" ").toLowerCase()
  const curriculum = (Array.isArray(row.curriculum_type) ? row.curriculum_type.join(" ") : row.curriculum_type ?? "").toLowerCase()
  const lang = (row.languages_spoken ?? "").toLowerCase()
  return (
    name.includes(q) ||
    desc.includes(q) ||
    city.includes(q) ||
    address.includes(q) ||
    types.includes(q) ||
    curriculum.includes(q) ||
    lang.includes(q)
  )
}

function matchesAgeTags(row: ActiveProviderRow, ageTags?: string[]): boolean {
  if (!ageTags?.length) return true
  const served = row.age_groups_served ?? []
  if (!served.length) return false
  return ageTags.some((tag) => served.some((s) => s.toLowerCase() === tag.toLowerCase()))
}

function matchesProviderTypes(row: ActiveProviderRow, types?: string[]): boolean {
  if (!types?.length) return true
  const profileTypes = (row.provider_types ?? []).map((t) => t.toLowerCase())
  if (!profileTypes.length) return false
  return types.some((t) => profileTypes.includes(t.toLowerCase()))
}

function matchesCurriculum(row: ActiveProviderRow, curriculumTypes?: string[]): boolean {
  if (!curriculumTypes?.length) return true
  const arr = row.curriculum_type ?? []
  if (!arr.length) return false
  const lower = arr.map((c) => c.toLowerCase())
  return curriculumTypes.some((t) => lower.some((c) => c.includes(t.toLowerCase()) || t.toLowerCase().includes(c)))
}

function matchesTuition(
  row: ActiveProviderRow,
  minTuition?: number,
  maxTuition?: number
): boolean {
  const from = row.daily_fee_from ?? 0
  const to = row.daily_fee_to ?? 99999
  if (minTuition !== undefined && to < minTuition) return false
  if (maxTuition !== undefined && from > maxTuition) return false
  return true
}

function matchesMinRating(row: ActiveProviderRow, minRating?: number): boolean {
  if (minRating === undefined) return true
  const rating = row.avg_rating ?? 0
  return rating >= minRating
}

function matchesLanguages(row: ActiveProviderRow, languages?: string[]): boolean {
  if (!languages?.length) return true
  const spoken = (row.languages_spoken ?? "")
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter(Boolean)
  if (!spoken.length) return false
  return languages.some((lang) =>
    spoken.some((s) => s.includes(lang.toLowerCase()) || lang.toLowerCase().includes(s))
  )
}

function normalizeAvailabilityFromRow(
  row: ActiveProviderRow
): "openings" | "waitlist" | "full" {
  if (row.availability_status === "waitlist" || row.availability_status === "full") {
    return row.availability_status
  }
  return "openings"
}

function matchesAvailability(
  row: ActiveProviderRow,
  availability?: SearchCriteria["availability"]
): boolean {
  if (!availability?.length) return true
  return availability.includes(normalizeAvailabilityFromRow(row))
}

export function filterActiveProviders(
  rows: ActiveProviderRow[],
  criteria: SearchCriteria
): ActiveProviderRow[] {
  const {
    locationText,
    queryText,
    ageTags,
    providerTypes,
    curriculumTypes,
    minTuition,
    maxTuition,
    minRating,
    languages,
    availability,
  } = criteria

  return rows.filter((row) => {
    if (!matchesLocation(row, locationText)) return false
    if (!matchesQuery(row, queryText)) return false
    if (!matchesAgeTags(row, ageTags)) return false
    if (!matchesProviderTypes(row, providerTypes)) return false
    if (!matchesCurriculum(row, curriculumTypes)) return false
    if (!matchesTuition(row, minTuition, maxTuition)) return false
    if (!matchesMinRating(row, minRating)) return false
    if (!matchesLanguages(row, languages)) return false
    if (!matchesAvailability(row, availability)) return false
    return true
  })
}

/** Dashboard "Recommended childcare near you" card shape (id is profile_id string). */
export type RecommendedProviderForDashboard = {
  id: string
  slug: string
  name: string
  rating: number
  reviewCount: number
  location: string
  ageGroups: string[]
  description: string
  image: string
}

function formatAgeGroupLabel(value: string): string {
  const lower = value.trim().toLowerCase()
  const map: Record<string, string> = {
    infant: "Infants",
    toddler: "Toddlers",
    preschool: "Preschool",
    prek: "Pre-K",
    school: "School Age",
    schoolage: "School Age",
    school_age: "School Age",
  }
  return map[lower] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

/** Map age_groups_served to program-type display labels for provider cards. */
function ageGroupsToProgramLabels(ageGroups: string[] | null): string[] {
  if (!ageGroups?.length) return []
  const labelMap: Record<string, string> = {
    infant: "Infant Care",
    toddler: "Toddler Care",
    preschool: "Preschool",
    prek: "Pre-K",
    school_age: "After School",
    schoolage: "After School",
  }
  const seen = new Set<string>()
  return ageGroups
    .map((g) => labelMap[g.trim().toLowerCase()] ?? formatAgeGroupLabel(g))
    .filter((label) => {
      if (seen.has(label)) return false
      seen.add(label)
      return true
    })
}

/**
 * Map age group name from DB to age_groups_served format used by provider_profiles.
 */
function ageGroupNameToTag(name: string): string {
  const lower = name.trim().toLowerCase()
  const map: Record<string, string> = {
    infant: "infant",
    toddler: "toddler",
    preschool: "preschool",
    "pre-k": "prek",
    "school age": "school_age",
    schoolage: "school_age",
  }
  return map[lower] ?? lower.replace(/\s+/g, "_")
}

/**
 * Fetch featured providers for a program type, filtered by age groups served.
 * Used on program detail pages for the "Featured Providers" section.
 */
export async function getFeaturedProvidersForProgram(
  programSlug: string,
  limit = 3,
  visitorGeo: VisitorGeo | null = null
): Promise<ProviderCardDataFromDb[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

  const [programType, ageGroupsById, activeRows] = await Promise.all([
    getProgramTypeBySlug(programSlug),
    getAgeGroupsById(),
    getActiveProvidersFromDbCached(),
  ])

  if (!programType) return []

  let ageTags: string[] | undefined
  const ageGroupIds = programType.age_group_ids ?? []

  if (ageGroupIds.length > 0 && ageGroupsById.size > 0) {
    ageTags = ageGroupIds
      .map((id) => ageGroupsById.get(id)?.name)
      .filter((n): n is string => !!n)
      .map(ageGroupNameToTag)
      .filter(Boolean)
  }

  const selected = selectFeaturedProviders(activeRows, { visitorGeo, limit, ageTags })
  return selected.map((row) => activeProviderRowToCardData(row, baseUrl))
}

export type { VisitorGeo } from "./visitor-geo"

/** Metro-wide radius for dashboard distance fallback (city/country tiers take priority when using `preferCityFirst`). */
const DASHBOARD_DISTANCE_RADIUS_KM = 100

export type GetRecommendedProvidersForDashboardOptions = {
  visitorGeo: VisitorGeo | null
  /** When set, prefer providers serving these age tags; falls back to all ages if geo yields no rows. */
  ageTags?: string[]
  /** Profile `city_name` , used for lenient matching when strict geo tiers return nothing (or when visitorGeo is null). */
  parentCityName?: string | null
}

function sortByRatingThenReviews(a: ActiveProviderRow, b: ActiveProviderRow): number {
  const ra = a.avg_rating ?? 0
  const rb = b.avg_rating ?? 0
  if (rb !== ra) return rb - ra
  return (b.review_count ?? 0) - (a.review_count ?? 0)
}

function normalizeForParentLocationMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Lenient “same city” check on provider city + address (handles formatting differences vs strict geo matching).
 */
function rowMatchesParentCityLoose(row: ActiveProviderRow, parentCityRaw: string | null): boolean {
  if (!parentCityRaw?.trim()) return false
  const primary = parentCityRaw.split(",")[0]?.trim() ?? parentCityRaw.trim()
  if (primary.length < 2) return false
  const vc = normalizeForParentLocationMatch(primary)
  if (!vc) return false
  const hay = normalizeForParentLocationMatch(`${row.city ?? ""} ${row.address ?? ""}`)
  if (!hay) return false
  if (hay.includes(vc)) return true
  const words = vc.split(/\s+/).filter((w) => w.length >= 3)
  return words.length > 1 && words.every((w) => hay.includes(w))
}

function rowMatchesParentAreaLoose(
  row: ActiveProviderRow,
  parentCity: string | null,
  visitorCountryCode: string | null
): boolean {
  if (!rowMatchesParentCityLoose(row, parentCity)) return false
  if (visitorCountryCode && row.country_code) {
    return visitorCountryCode.toUpperCase() === row.country_code.toUpperCase()
  }
  return true
}

/**
 * Fetch recommended providers for parent dashboard: active listed providers in the
 * visitor’s area (distance → city → country), sorted by rating then reviews.
 * Returns [] when `visitorGeo` is null or no providers match the area.
 */
export async function getRecommendedProvidersForDashboard(
  _supabase: SupabaseClient,
  baseUrl: string,
  limit = 3,
  options?: GetRecommendedProvidersForDashboardOptions
): Promise<RecommendedProviderForDashboard[]> {
  const visitorGeo = options?.visitorGeo ?? null
  const ageTags = options?.ageTags
  const parentCityName = options?.parentCityName ?? null

  const rows = await getActiveProvidersFromDbCached()

  let pool: ActiveProviderRow[] = rows
  if (ageTags?.length) {
    const scoped = rows.filter((row) => rowMatchesFeaturedAgeTags(row, ageTags))
    if (scoped.length > 0) {
      pool = scoped
    }
  }

  const geoOpts = {
    radiusKm: DASHBOARD_DISTANCE_RADIUS_KM,
    preferCityFirst: Boolean(visitorGeo?.city?.trim()),
    distanceRadiusKm: DASHBOARD_DISTANCE_RADIUS_KM,
  }

  let local: ActiveProviderRow[] = []

  if (visitorGeo) {
    local = filterProvidersByVisitorGeo(pool, visitorGeo, geoOpts)
    if (local.length === 0) {
      local = filterProvidersByVisitorGeo(rows, visitorGeo, geoOpts)
    }
    if (local.length === 0 && parentCityName?.trim()) {
      local = pool.filter((r) =>
        rowMatchesParentAreaLoose(r, parentCityName, visitorGeo.countryCode)
      )
    }
    if (local.length === 0 && parentCityName?.trim()) {
      local = rows.filter((r) =>
        rowMatchesParentAreaLoose(r, parentCityName, visitorGeo.countryCode)
      )
    }
  } else if (parentCityName?.trim()) {
    local = pool.filter((r) => rowMatchesParentAreaLoose(r, parentCityName, null))
    if (local.length === 0) {
      local = rows.filter((r) => rowMatchesParentAreaLoose(r, parentCityName, null))
    }
  }

  if (local.length === 0) {
    return []
  }

  const sorted = [...local].sort(sortByRatingThenReviews)
  const top = sorted.slice(0, limit)
  return top.map((row) => {
    const slug = row.provider_slug ?? row.profile_id
    const location = [row.city, row.address].filter(Boolean).join(", ") || ","
    const image = buildProviderCardImageUrl(
      row.primary_photo_storage_path,
      row.google_photo_reference,
      baseUrl
    )
    const ageGroups = (row.age_groups_served ?? []).map(formatAgeGroupLabel)
    return {
      id: row.profile_id,
      slug,
      name: row.business_name ?? "Provider",
      rating: row.avg_rating ?? 0,
      reviewCount: row.review_count,
      location,
      ageGroups,
      description: (row.description ?? "").slice(0, 200).trim() || "Childcare provider.",
      image,
    }
  })
}

export function activeProviderRowToCardData(
  row: ActiveProviderRow,
  baseUrl: string
): ProviderCardDataFromDb {
  const slug = row.provider_slug ?? row.profile_id
  const name = row.business_name ?? "Provider"
  const location = [row.city, row.address].filter(Boolean).join(", ") || ","
  const from = row.daily_fee_from
  const to = row.daily_fee_to
  const symbol =
    (row.currencies as { symbol?: string } | null)?.symbol ?? "$"
  const priceRange = formatDailyFeeRange(from, to, symbol)
  const image = buildProviderCardImageUrl(
    row.primary_photo_storage_path,
    row.google_photo_reference,
    baseUrl
  )
  const programTypes = ageGroupsToProgramLabels(row.age_groups_served)

  return {
    id: row.profile_id,
    slug,
    name,
    rating: row.avg_rating ?? 0,
    reviewCount: row.review_count,
    location,
    priceRange,
    providerTypes: toProviderTypeIds(row.provider_types),
    programTypes,
    shortDescription: (row.description ?? "").slice(0, 200),
    image,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    address: row.address ?? "",
    featured: row.featured ?? false,
    earlyLearningExcellenceBadge: row.early_learning_excellence_badge ?? false,
    verifiedProviderBadge: row.verified_provider_badge ?? false,
    verifiedProviderBadgeColor: row.verified_provider_badge_color ?? "emerald",
    savedByParentCount: row.saved_by_parent_count ?? 0,
  }
}
