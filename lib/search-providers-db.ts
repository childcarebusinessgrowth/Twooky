import { unstable_cache } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SearchCriteria } from "./search-providers"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { PROVIDER_TYPES, type ProviderTypeId } from "./provider-types"
import type { GooglePlaceDetailsSummary } from "./google-place-reviews"
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
import {
  formatAgeGroupLabel,
} from "@/lib/age-groups-to-program-labels"
import {
  hasFreshCachedGoogleReviews,
  readCachedGooglePlaceSummary,
  type ProviderGoogleCacheRow,
} from "@/lib/google-place-cache"
import {
  getProviderProgramTypesByProfileIds,
  type ProviderProgramType,
} from "@/lib/provider-program-types"

const PROVIDER_PROFILE_SELECT_WITH_GOOGLE_CACHE =
  "profile_id, provider_slug, business_name, city, address, google_place_id, google_fallback_storage_path, google_photo_reference_cached, google_rating_cached, google_review_count_cached, google_reviews_url_cached, google_reviews_cached_at, description, provider_types, age_groups_served, curriculum_type, languages_spoken, daily_fee_from, daily_fee_to, currency_id, currencies(symbol), featured, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count, country_id, countries(code)"

const PROVIDER_PROFILE_SELECT_LEGACY =
  "profile_id, provider_slug, business_name, city, address, google_place_id, description, provider_types, age_groups_served, curriculum_type, languages_spoken, daily_fee_from, daily_fee_to, currency_id, currencies(symbol), featured, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count, country_id, countries(code)"

const HOME_FEATURED_SELECT_WITH_GOOGLE_CACHE =
  "profile_id, provider_slug, business_name, city, address, description, provider_types, age_groups_served, daily_fee_from, daily_fee_to, currencies(symbol), early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, google_place_id, google_fallback_storage_path, google_photo_reference_cached, google_rating_cached, google_review_count_cached, google_reviews_url_cached, google_reviews_cached_at"

const HOME_FEATURED_SELECT_LEGACY =
  "profile_id, provider_slug, business_name, city, address, description, provider_types, age_groups_served, daily_fee_from, daily_fee_to, currencies(symbol), early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, google_place_id"

function isMissingColumnError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase()
  return m.includes("does not exist") && m.includes("column")
}

function withGoogleCacheFallbackFields<
  T extends { google_place_id?: string | null; profile_id: string }
>(row: T): T & {
  google_fallback_storage_path: string | null
  google_photo_reference_cached: string | null
  google_rating_cached: number | null
  google_review_count_cached: number | null
  google_reviews_url_cached: string | null
  google_reviews_cached_at: string | null
} {
  return {
    ...row,
    google_fallback_storage_path: null,
    google_photo_reference_cached: null,
    google_rating_cached: null,
    google_review_count_cached: null,
    google_reviews_url_cached: null,
    google_reviews_cached_at: null,
  }
}

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
  /** Saved one-time Google fallback image in Supabase Storage. */
  google_cached_photo_storage_path: string | null
  /** First Places API photo ref when no primary/cached upload; used with `/api/place-photo`. */
  google_photo_reference: string | null
  program_types: ProviderProgramType[]
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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function getActiveProvidersFromDb(
  supabase: SupabaseClient
): Promise<ActiveProviderRow[]> {
  let { data: profiles, error: profilesError } = await supabase
    .from("provider_profiles")
    .select(PROVIDER_PROFILE_SELECT_WITH_GOOGLE_CACHE)
    .eq("listing_status", "active")
    .not("provider_slug", "is", null)

  if (profilesError && isMissingColumnError(profilesError.message)) {
    const retry = await supabase
      .from("provider_profiles")
      .select(PROVIDER_PROFILE_SELECT_LEGACY)
      .eq("listing_status", "active")
      .not("provider_slug", "is", null)
    profiles = retry.data?.map((row) => withGoogleCacheFallbackFields(row)) ?? null
    profilesError = retry.error
  }

  if (profilesError || !profiles?.length) return []

  const profileIds = profiles.map((p) => p.profile_id)

  const [photosResult, reviewsResult, favoritesResult, programTypesByProfile] = await Promise.all([
    supabase
      .from("provider_photos")
      .select("provider_profile_id, storage_path, is_primary, sort_order, created_at")
      .in("provider_profile_id", profileIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("parent_reviews")
      .select("provider_profile_id, rating")
      .in("provider_profile_id", profileIds),
    supabase
      .from("parent_favorites")
      .select("provider_profile_id, parent_profile_id")
      .in("provider_profile_id", profileIds),
    getProviderProgramTypesByProfileIds(supabase, profileIds),
  ])

  const primaryPhotoByProfile: Record<string, string> = {}
  const anyPhotoByProfile: Record<string, string> = {}
  ;(photosResult.data ?? []).forEach((row) => {
    const providerId = row.provider_profile_id
    if (!providerId || !row.storage_path) return
    if (!anyPhotoByProfile[providerId]) {
      anyPhotoByProfile[providerId] = row.storage_path
    }
    if (row.is_primary && !primaryPhotoByProfile[providerId]) {
      primaryPhotoByProfile[providerId] = row.storage_path
    }
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
  const googleCachedPhotoPathByProfile: Record<string, string | null> = {}
  const coordsByProfile: Record<string, { lat: number; lng: number } | null> = {}
  profiles.forEach((profile) => {
    const summary = readCachedGooglePlaceSummary(profile as ProviderGoogleCacheRow)
    const cachedGooglePhotoPath =
      (profile as { google_fallback_storage_path?: string | null }).google_fallback_storage_path?.trim() ||
      null
    googleSummaryByProfile[profile.profile_id] = summary
    googleCachedPhotoPathByProfile[profile.profile_id] = cachedGooglePhotoPath
    const latitude = toFiniteNumber(
      (profile as { latitude?: number | string | null }).latitude ?? summary?.latitude ?? null
    )
    const longitude = toFiniteNumber(
      (profile as { longitude?: number | string | null }).longitude ?? summary?.longitude ?? null
    )
    coordsByProfile[profile.profile_id] =
      latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null
  })

  return profiles.map((p) => {
    const stats = reviewStatsByProfile[p.profile_id]
    const platformCount = stats?.count ?? 0
    const platformAvgRating = stats && platformCount > 0 ? stats.sum / platformCount : null
    const googleSummary = googleSummaryByProfile[p.profile_id]
    const shouldUseGoogleSummary =
      platformCount === 0 && hasFreshCachedGoogleReviews(p as ProviderGoogleCacheRow)
    const count = shouldUseGoogleSummary
      ? (googleSummary?.reviewCount ?? platformCount)
      : platformCount
    const avgRating = shouldUseGoogleSummary
      ? (googleSummary?.rating ?? platformAvgRating)
      : platformAvgRating
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
      primary_photo_storage_path:
        primaryPhotoByProfile[p.profile_id] ?? anyPhotoByProfile[p.profile_id] ?? null,
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
      google_cached_photo_storage_path: googleCachedPhotoPathByProfile[p.profile_id] ?? null,
      google_photo_reference: googlePhotoRef,
      program_types: programTypesByProfile[p.profile_id] ?? [],
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
  ["directory-active-providers-v6-program-types"],
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
  google_fallback_storage_path: string | null
  google_photo_reference_cached: string | null
  google_rating_cached: number | null
  google_review_count_cached: number | null
  google_reviews_url_cached: string | null
  google_reviews_cached_at: string | null
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
        .select(HOME_FEATURED_SELECT_WITH_GOOGLE_CACHE)
        .eq("listing_status", "active")
        .eq("featured", true)
        .not("provider_slug", "is", null)
        .limit(limit)

      let profileRows = profiles
      let profileRowsError = profilesError
      if (profileRowsError && isMissingColumnError(profileRowsError.message)) {
        const retry = await supabase
          .from("provider_profiles")
          .select(HOME_FEATURED_SELECT_LEGACY)
          .eq("listing_status", "active")
          .eq("featured", true)
          .not("provider_slug", "is", null)
          .limit(limit)
        profileRows = retry.data?.map((row) => withGoogleCacheFallbackFields(row)) ?? null
        profileRowsError = retry.error
      }

      if (profileRowsError || !profileRows?.length) {
        if (profileRowsError) {
          console.error("[home-featured] Failed lightweight featured provider query", profileRowsError.message)
        }
        return []
      }

      const profileIds = profileRows.map((row) => row.profile_id)

      const [{ data: photos }, reviewsResult, favoritesResult, programTypesByProfile] = await Promise.all([
        supabase
          .from("provider_photos")
          .select("provider_profile_id, storage_path, is_primary, sort_order, created_at")
          .in("provider_profile_id", profileIds)
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("parent_reviews")
          .select("provider_profile_id, rating")
          .in("provider_profile_id", profileIds),
        supabase
          .from("parent_favorites")
          .select("provider_profile_id, parent_profile_id")
          .in("provider_profile_id", profileIds),
        getProviderProgramTypesByProfileIds(supabase, profileIds),
      ])

      const photoByProfileId: Record<string, string> = {}
      const anyPhotoByProfileId: Record<string, string> = {}
      ;(photos ?? []).forEach((row) => {
        if (!row.provider_profile_id || !row.storage_path) return
        if (!anyPhotoByProfileId[row.provider_profile_id]) {
          anyPhotoByProfileId[row.provider_profile_id] = row.storage_path
        }
        if (row.is_primary && !photoByProfileId[row.provider_profile_id]) {
          photoByProfileId[row.provider_profile_id] = row.storage_path
        }
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
      const googleCachedPhotoPathByProfile: Record<string, string | null> = {}
      ;(profileRows as HomeFeaturedProfileRow[]).forEach((profile) => {
        googleSummaryByProfile[profile.profile_id] = readCachedGooglePlaceSummary(
          profile as ProviderGoogleCacheRow
        )
        googleCachedPhotoPathByProfile[profile.profile_id] =
          profile.google_fallback_storage_path?.trim() || null
      })

      return (profileRows as HomeFeaturedProfileRow[]).map((row) => {
        const slug = row.provider_slug ?? row.profile_id
        const symbol = (row.currencies as { symbol?: string } | null)?.symbol ?? "$"
        const googleSummary = googleSummaryByProfile[row.profile_id]
        const image = buildProviderCardImageUrl(
          photoByProfileId[row.profile_id] ?? anyPhotoByProfileId[row.profile_id] ?? null,
          googleCachedPhotoPathByProfile[row.profile_id] ?? null,
          googleSummary?.photoReference ?? null,
          baseUrl
        )

        const stats = reviewStatsByProfile[row.profile_id]
        const platformCount = stats?.count ?? 0
        const platformAvgRating =
          stats && platformCount > 0 ? stats.sum / platformCount : null
        const shouldUseGoogleSummary =
          platformCount === 0 && hasFreshCachedGoogleReviews(row as ProviderGoogleCacheRow)
        const reviewCount = shouldUseGoogleSummary
          ? (googleSummary?.reviewCount ?? platformCount)
          : platformCount
        const avgRating = shouldUseGoogleSummary
          ? (googleSummary?.rating ?? platformAvgRating)
          : platformAvgRating
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
          programTypes: (programTypesByProfile[row.profile_id] ?? []).map((programType) => programType.name),
          shortDescription: (row.description ?? "").slice(0, 200),
          image,
          latitude: typeof lat === "number" && Number.isFinite(lat) ? lat : Number.NaN,
          longitude: typeof lng === "number" && Number.isFinite(lng) ? lng : Number.NaN,
          address: row.address ?? "",
          featured: true,
          earlyLearningExcellenceBadge: row.early_learning_excellence_badge ?? false,
          verifiedProviderBadge: row.verified_provider_badge ?? false,
          verifiedProviderBadgeColor: row.verified_provider_badge_color ?? "emerald",
          savedByParentCount: savedByParentCountByProfile[row.profile_id] ?? 0,
        }
      })
    },
    ["home-featured-providers-v8-program-types", String(limit)],
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

function matchesProgramTypes(row: ActiveProviderRow, programTypes?: string[]): boolean {
  if (!programTypes?.length) return true
  const rowProgramTypes = row.program_types.map((value) =>
    value.name.toLowerCase()
  )
  if (!rowProgramTypes.length) return false
  return programTypes.some((programType) => {
    const normalized = programType.toLowerCase()
    return rowProgramTypes.some(
      (candidate) => candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate),
    )
  })
}

function hasProgramTypeSlug(row: ActiveProviderRow, programSlug: string): boolean {
  const normalizedProgramSlug = programSlug.trim().toLowerCase()
  if (!normalizedProgramSlug) return false
  return row.program_types.some(
    (programType) => (programType.slug ?? "").trim().toLowerCase() === normalizedProgramSlug
  )
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
    programTypes,
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
    if (!matchesProgramTypes(row, programTypes)) return false
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

/**
 * Fetch featured providers for a program type, filtered by saved provider program types.
 * Used on program detail pages for the "Featured Providers" section.
 */
export async function getFeaturedProvidersForProgram(
  programSlug: string,
  limit = 3,
  visitorGeo: VisitorGeo | null = null
): Promise<ProviderCardDataFromDb[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

  const [programType, activeRows] = await Promise.all([
    getProgramTypeBySlug(programSlug),
    getActiveProvidersFromDbCached(),
  ])

  if (!programType) return []

  const matchingRows = activeRows.filter((row) => hasProgramTypeSlug(row, programSlug))
  const selected = selectFeaturedProviders(matchingRows, { visitorGeo, limit })
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
      row.google_cached_photo_storage_path,
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
    row.google_cached_photo_storage_path,
    row.google_photo_reference,
    baseUrl
  )
  const programTypes = row.program_types.map((programType) => programType.name)

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
    latitude: row.latitude ?? Number.NaN,
    longitude: row.longitude ?? Number.NaN,
    address: row.address ?? "",
    featured: row.featured ?? false,
    earlyLearningExcellenceBadge: row.early_learning_excellence_badge ?? false,
    verifiedProviderBadge: row.verified_provider_badge ?? false,
    verifiedProviderBadgeColor: row.verified_provider_badge_color ?? "emerald",
    savedByParentCount: row.saved_by_parent_count ?? 0,
  }
}
