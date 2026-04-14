import { unstable_cache } from "next/cache"
import { type Provider } from "@/lib/mock-data"
import {
  resolveLocationToCoords,
  type AgeTag,
  type SearchCriteria,
} from "@/lib/search-providers"
import {
  getActiveProvidersFromDbCached,
  filterActiveProviders,
  activeProviderRowToCardData,
  type ProviderCardDataFromDb,
} from "@/lib/search-providers-db"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { normalizeAgeRangeLabel } from "@/lib/age-range-label"
import { resolveLocationTextFromQuery } from "@/lib/search-location-query"
import type { SearchFilterOptions } from "@/components/filter-sidebar"

export type SearchPageQueryParams = {
  location?: string
  q?: string
  country?: string
  city?: string
  type?: string
  age?: string
  program?: string
  providerType?: string
  radius?: string
  programTypes?: string
  curriculum?: string
  minFee?: string
  maxFee?: string
  availability?: string
  minRating?: string
  languages?: string
  features?: string
  ageGroups?: string
}

const MAX_SERIALIZED_SEARCH_RESULTS = 150

const AGE_TAGS: ReadonlySet<AgeTag> = new Set([
  "infant",
  "toddler",
  "preschool",
  "prek",
  "schoolage",
])

const AVAILABILITY_VALUES: ReadonlySet<Provider["availability"]> = new Set([
  "openings",
  "waitlist",
  "full",
])

function parseCsv(value?: string): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseAgeTags(value?: string): AgeTag[] {
  return parseCsv(value)
    .map((item) => (item === "school_age" ? "schoolage" : item))
    .filter((item): item is AgeTag => AGE_TAGS.has(item as AgeTag))
}

function parseAvailability(value?: string): Provider["availability"][] {
  return parseCsv(value).filter((item): item is Provider["availability"] =>
    AVAILABILITY_VALUES.has(item as Provider["availability"]),
  )
}

function parseOptionalNumber(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseProgramTypes(
  programTypesValue?: string,
  singleProgramSlug?: string,
  programTypesBySlug?: Record<string, string>,
): string[] | undefined {
  const fromCsv = parseCsv(programTypesValue)
  if (fromCsv.length > 0) return fromCsv

  if (!singleProgramSlug || !programTypesBySlug) return undefined
  const name = programTypesBySlug[singleProgramSlug]
  return name ? [name] : undefined
}

async function loadSearchFilterOptions(): Promise<SearchFilterOptions> {
  try {
    const supabase = getSupabaseAdminClient()

    const [
      { data: ageGroups },
      { data: programTypes },
      { data: languages },
      { data: curriculum },
      { data: features },
      { data: defaultCurrency },
    ] = await Promise.all([
      supabase
        .from("age_groups")
        .select("id, tag, age_range")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("age_range", { ascending: true }),
      supabase
        .from("program_types")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("languages")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("curriculum_philosophies")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("provider_features")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("currencies")
        .select("symbol")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    const programTypesBySlug: Record<string, string> = {}
    for (const row of programTypes ?? []) {
      const slug = (row as { slug?: string }).slug
      if (slug) programTypesBySlug[slug] = row.name
    }

    const currencySymbol = (defaultCurrency as { symbol?: string } | null)?.symbol ?? "$"

    return {
      ageGroups: (ageGroups ?? []).map((row) => {
        return {
          value: row.tag === "school_age" ? "schoolage" : row.tag,
          label: normalizeAgeRangeLabel(row.age_range),
        }
      }),
      programTypes: (programTypes ?? []).map((row) => ({ value: row.name, label: row.name })),
      languages: (languages ?? []).map((row) => ({ value: row.name, label: row.name })),
      curriculum: (curriculum ?? []).map((row) => ({ value: row.name, label: row.name })),
      features: (features ?? []).map((row) => ({ value: row.name, label: row.name })),
      programTypesBySlug,
      currencySymbol,
    }
  } catch (error) {
    console.error("[search] Failed to load search filter options", error)
    return {
      ageGroups: [],
      programTypes: [],
      languages: [],
      curriculum: [],
      features: [],
      programTypesBySlug: {},
      currencySymbol: "$",
    }
  }
}

const loadSearchFilterOptionsCached = unstable_cache(
  () => loadSearchFilterOptions(),
  ["search-filter-options"],
  { revalidate: 300, tags: [CACHE_TAGS.directoryFilters] },
)

export async function getSearchFilterOptions(): Promise<SearchFilterOptions> {
  return loadSearchFilterOptionsCached()
}

export async function getSearchPageData(options: {
  searchParams: SearchPageQueryParams
  forcedProviderType?: string
  forcedCountryCode?: string
  forcedCityName?: string
  forcedLocationText?: string
}): Promise<{ providers: ProviderCardDataFromDb[]; filterOptions: SearchFilterOptions }> {
  const { searchParams, forcedProviderType, forcedCountryCode, forcedCityName, forcedLocationText } = options
  const {
    location,
    q,
    city,
    type,
    age,
    program,
    providerType,
    radius,
    programTypes,
    curriculum,
    minFee,
    maxFee,
    availability,
    minRating,
    languages,
    features,
    ageGroups,
  } = searchParams

  const locationText = forcedLocationText ?? resolveLocationTextFromQuery({ location, city })
  const resolvedProviderType = forcedProviderType ?? providerType ?? type
  const coords = resolveLocationToCoords(locationText)
  const parsedAgeTags = parseAgeTags(ageGroups) ?? []
  const fallbackAge = parseAgeTags(age) ?? []
  const parsedAvailability = parseAvailability(availability)
  const parsedFeatures = parseCsv(features)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

  const [filterOptions, activeRows] = await Promise.all([
    loadSearchFilterOptionsCached(),
    getActiveProvidersFromDbCached(),
  ])

  const parsedProgramTypes = parseProgramTypes(
    programTypes,
    program,
    filterOptions.programTypesBySlug ?? {},
  )

  const criteria: SearchCriteria = {
    locationText,
    queryText: q?.trim() || undefined,
    centerLat: coords?.lat,
    centerLng: coords?.lng,
    radiusKm: parseOptionalNumber(radius),
    ageTags: parsedAgeTags.length > 0 ? parsedAgeTags : fallbackAge.length > 0 ? fallbackAge : undefined,
    programTypes: parsedProgramTypes,
    providerTypes: resolvedProviderType && resolvedProviderType !== "all" ? [resolvedProviderType] : undefined,
    curriculumTypes: parseCsv(curriculum),
    minTuition: parseOptionalNumber(minFee),
    maxTuition: parseOptionalNumber(maxFee),
    availability: parsedAvailability.length > 0 ? parsedAvailability : undefined,
    minRating: parseOptionalNumber(minRating),
    languages: parseCsv(languages),
    specialNeedsOnly:
      parsedFeatures.includes("Special Needs Support") ||
      parsedFeatures.includes("special-needs"),
  }

  const countryCodeFilter = forcedCountryCode?.trim().toUpperCase()
  const cityFilter = forcedCityName?.trim().toLowerCase()

  const forcedRows = activeRows.filter((row) => {
    if (countryCodeFilter) {
      const rowCode = row.country_code?.trim().toUpperCase()
      if (rowCode !== countryCodeFilter) return false
    }
    if (cityFilter) {
      const rowCity = row.city?.trim().toLowerCase()
      if (!rowCity || rowCity !== cityFilter) return false
    }
    return true
  })

  const filteredRows = filterActiveProviders(forcedRows, criteria)
  const rankedRows = [...filteredRows].sort((a, b) => {
    const featuredDiff = Number(b.featured) - Number(a.featured)
    if (featuredDiff !== 0) return featuredDiff

    const ratingDiff = (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff

    const reviewDiff = (b.review_count ?? 0) - (a.review_count ?? 0)
    if (reviewDiff !== 0) return reviewDiff

    return (a.business_name ?? "").localeCompare(b.business_name ?? "")
  })

  const providers = rankedRows
    .slice(0, MAX_SERIALIZED_SEARCH_RESULTS)
    .map((row) => activeProviderRowToCardData(row, baseUrl))

  return {
    providers,
    filterOptions,
  }
}
