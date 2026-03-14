import { Suspense } from "react"
import { SearchResults } from "@/components/search-results"
import { programs, providers, type Provider } from "@/lib/mock-data"
import {
  filterProviders,
  resolveLocationToCoords,
  type AgeTag,
  type SearchCriteria,
} from "@/lib/search-providers"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { SearchFilterOptions } from "@/components/filter-sidebar"

export const metadata = {
  title: "Search Childcare | Early Learning Directory",
  description: "Search and compare childcare providers in your area. Filter by age group, program type, price, and more.",
}

interface SearchPageProps {
  searchParams?: Promise<{
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
  }>
}

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
  return parseCsv(value).filter((item): item is AgeTag => AGE_TAGS.has(item as AgeTag))
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

function parseProgramTypes(programTypesValue?: string, singleProgramSlug?: string): string[] | undefined {
  const fromCsv = parseCsv(programTypesValue)
  if (fromCsv.length > 0) return fromCsv

  if (!singleProgramSlug) return undefined
  const program = programs.find((entry) => entry.slug === singleProgramSlug)
  return program ? [program.title] : undefined
}

function normalizeCitySlug(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/-/g, " ")
}

function resolveLocationText(params: {
  location?: string
  city?: string
  q?: string
}): string | undefined {
  const normalizedLocation = params.location?.trim()
  if (normalizedLocation) return normalizedLocation

  const cityFromSlug = normalizeCitySlug(params.city)
  if (cityFromSlug) return cityFromSlug

  return undefined
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
    ] = await Promise.all([
      supabase
        .from("age_groups")
        .select("id, name, age_range")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("program_types")
        .select("id, name")
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
    ])

    return {
      ageGroups: (ageGroups ?? []).map((row) => {
        const label = row.age_range ? `${row.name} (${row.age_range})` : row.name
        return { value: label, label }
      }),
      programTypes: (programTypes ?? []).map((row) => ({ value: row.name, label: row.name })),
      languages: (languages ?? []).map((row) => ({ value: row.name, label: row.name })),
      curriculum: (curriculum ?? []).map((row) => ({ value: row.name, label: row.name })),
      features: (features ?? []).map((row) => ({ value: row.name, label: row.name })),
    }
  } catch (error) {
    console.error("[search] Failed to load search filter options", error)
    return {
      ageGroups: [],
      programTypes: [],
      languages: [],
      curriculum: [],
      features: [],
    }
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
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
  } = resolvedSearchParams

  const locationText = resolveLocationText({ location, city, q })
  const resolvedProviderType = providerType ?? type
  const coords = resolveLocationToCoords(locationText)
  const parsedAgeTags = parseAgeTags(ageGroups) ?? []
  const fallbackAge = parseAgeTags(age) ?? []
  const parsedProgramTypes = parseProgramTypes(programTypes, program)
  const parsedAvailability = parseAvailability(availability)
  const parsedFeatures = parseCsv(features)

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

  const [filterOptions, filteredProviders] = await Promise.all([
    loadSearchFilterOptions(),
    Promise.resolve(filterProviders(providers, criteria)),
  ])

  const providerSummaries = filteredProviders.map((provider) => ({
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    location: provider.location,
    priceRange: provider.priceRange,
    providerTypes: provider.providerTypes,
    programTypes: provider.programTypes,
    shortDescription: provider.shortDescription,
    image: provider.image,
    latitude: provider.latitude,
    longitude: provider.longitude,
    address: provider.address,
  }))

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SearchResults providers={providerSummaries} filterOptions={filterOptions} />
    </Suspense>
  )
}
