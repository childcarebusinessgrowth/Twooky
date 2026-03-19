import type { SupabaseClient } from "@supabase/supabase-js"
import type { SearchCriteria } from "./search-providers"
import { PROVIDER_TYPES, type ProviderTypeId } from "./provider-types"
import { fetchGooglePlaceReviewSummary } from "./google-place-reviews"
import { geocodeAddressToCoordinates } from "./geocode-server"
import { formatTuitionRange } from "./currency"
import { getProgramTypeBySlug, getAgeGroupsById } from "./program-types"
import { getSupabaseAdminClient } from "./supabaseAdmin"
import { selectFeaturedProviders } from "./featured-providers-selection"
import type { VisitorGeo } from "./visitor-geo"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

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
  monthly_tuition_from: number | null
  monthly_tuition_to: number | null
  currencies?: { symbol?: string } | null
  primary_photo_storage_path: string | null
  review_count: number
  avg_rating: number | null
  featured: boolean
  saved_by_parent_count: number
  /** ISO 3166-1 alpha-2 from `countries.code` when `country_id` is set */
  country_code: string | null
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
  savedByParentCount: number
}

function buildPhotoPublicUrl(storagePath: string, baseUrl: string): string {
  return `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${storagePath}`
}

/** Local placeholder when provider has no primary photo (avoids external domain restrictions). */
const PLACEHOLDER_IMAGE = "/images/placeholder-provider.svg"
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
      "profile_id, provider_slug, business_name, city, address, google_place_id, description, provider_types, age_groups_served, curriculum_type, languages_spoken, monthly_tuition_from, monthly_tuition_to, currency_id, currencies(symbol), featured, country_id, countries(code)"
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

  const googleSummaryByProfile: Record<
    string,
    { rating: number; reviewCount: number; latitude?: number; longitude?: number } | null
  > = {}
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

  const coordsByProfile: Record<string, { lat: number; lng: number } | null> = {}
  await Promise.all(
    profiles.map(async (profile) => {
      const summary = await fetchGooglePlaceReviewSummary(profile.google_place_id, googleApiKey)
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
      monthly_tuition_from: p.monthly_tuition_from,
      monthly_tuition_to: p.monthly_tuition_to,
      currencies: (p as { currencies?: { symbol?: string } | null }).currencies ?? null,
      primary_photo_storage_path: primaryPhotoByProfile[p.profile_id] ?? null,
      review_count: count,
      avg_rating: avgRating,
      featured: (p as { featured?: boolean }).featured ?? false,
      saved_by_parent_count: savedByParentCountByProfile[p.profile_id] ?? 0,
      country_code: countryCode,
    }
  })
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
  const from = row.monthly_tuition_from ?? 0
  const to = row.monthly_tuition_to ?? 99999
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
  const supabase = getSupabaseAdminClient()

  const [programType, ageGroupsById, activeRows] = await Promise.all([
    getProgramTypeBySlug(programSlug),
    getAgeGroupsById(),
    getActiveProvidersFromDb(supabase),
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

/**
 * Fetch recommended providers for parent dashboard: active, listed providers
 * sorted by rating (desc) then review count (desc), limited to `limit`.
 */
export async function getRecommendedProvidersForDashboard(
  supabase: SupabaseClient,
  baseUrl: string,
  limit = 3
): Promise<RecommendedProviderForDashboard[]> {
  const rows = await getActiveProvidersFromDb(supabase)
  const sorted = [...rows].sort((a, b) => {
    const ra = a.avg_rating ?? 0
    const rb = b.avg_rating ?? 0
    if (rb !== ra) return rb - ra
    return (b.review_count ?? 0) - (a.review_count ?? 0)
  })
  const top = sorted.slice(0, limit)
  return top.map((row) => {
    const slug = row.provider_slug ?? row.profile_id
    const location = [row.city, row.address].filter(Boolean).join(", ") || "—"
    const image = row.primary_photo_storage_path
      ? buildPhotoPublicUrl(row.primary_photo_storage_path, baseUrl)
      : PLACEHOLDER_IMAGE
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
  const location = [row.city, row.address].filter(Boolean).join(", ") || "—"
  const from = row.monthly_tuition_from
  const to = row.monthly_tuition_to
  const symbol =
    (row.currencies as { symbol?: string } | null)?.symbol ?? "$"
  const priceRange = formatTuitionRange(from, to, symbol)
  const image = row.primary_photo_storage_path
    ? buildPhotoPublicUrl(row.primary_photo_storage_path, baseUrl)
    : PLACEHOLDER_IMAGE
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
    savedByParentCount: row.saved_by_parent_count ?? 0,
  }
}
