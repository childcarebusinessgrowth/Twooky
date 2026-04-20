import "server-only"

import { unstable_cache } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { PopularLocationGroup } from "@/lib/popular-locations"
import type { MarketId } from "@/lib/market"
import { cityRowMatchesMarket } from "@/lib/market"

type CountryRow = {
  id: string
  code: string
  name: string
  sort_order: number | null
  is_active: boolean
}

type CityRow = {
  id: string
  country_id: string
  name: string
  slug: string
  search_country_code: string
  search_city_slug: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
  country_code: string | null
}

type CityLookupRow = {
  id: string
  country_id: string
  name: string
  slug: string
  search_country_code: string
  search_city_slug: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
  countries?: { code?: string | null } | null
}

export type LocationRouteParams = {
  country: string
  city: string
}

function normalizeCountryCodeForPath(code: string): string {
  return code.trim().toLowerCase()
}

export function buildLocationHref(countryCode: string, citySlug: string): string {
  return `/locations/${normalizeCountryCodeForPath(countryCode)}/${citySlug.trim().toLowerCase()}`
}

export function buildLocationProviderTypeHref(
  countryCode: string,
  citySlug: string,
  providerType: string,
): string {
  return `${buildLocationHref(countryCode, citySlug)}/${providerType.trim().toLowerCase()}`
}

function mapCityLookupRow(row: CityLookupRow): CityRow {
  const relationCode =
    typeof row.countries?.code === "string" && row.countries.code.trim()
      ? row.countries.code.trim().toLowerCase()
      : null

  return {
    ...row,
    country_code: relationCode ?? normalizeCountryCodeForPath(row.search_country_code),
  }
}

type PopularLocationGroupOptions = {
  countryLimit?: number
  citiesPerCountry?: number
}

export async function getPopularLocationGroups(
  options: PopularLocationGroupOptions = {},
): Promise<PopularLocationGroup[]> {
  const supabase = getSupabaseAdminClient()

  const { countryLimit, citiesPerCountry } = options

  const wantsCountryLimit = typeof countryLimit === "number" && countryLimit > 0
  const wantsCitiesPerCountry = typeof citiesPerCountry === "number" && citiesPerCountry > 0

  let countries: CountryRow[] = []
  let cities: Array<{
    id: string
    country_id: string
    name: string
    slug: string
    search_country_code: string
    search_city_slug: string
    is_popular: boolean
    sort_order: number | null
    is_active: boolean
  }> = []
  let countriesError: unknown = null
  let citiesError: unknown = null

  if (!wantsCountryLimit && !wantsCitiesPerCountry) {
    const [countriesResult, citiesResult] = await Promise.all([
      supabase
        .from("countries")
        .select("id, code, name, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("cities")
        .select(
          "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
        )
        .eq("is_active", true)
        .eq("is_popular", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ])

    countries = ((countriesResult.data ?? []) as CountryRow[]) ?? []
    countriesError = countriesResult.error ?? null
    cities = ((citiesResult.data ?? []) as typeof cities) ?? []
    citiesError = citiesResult.error ?? null
  } else {
    let countriesQuery = supabase
      .from("countries")
      .select("id, code, name, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (wantsCountryLimit) {
      countriesQuery = countriesQuery.limit(countryLimit)
    }

    const countriesResult = await countriesQuery
    countries = ((countriesResult.data ?? []) as CountryRow[]) ?? []
    countriesError = countriesResult.error ?? null

    if (!countriesError && countries.length > 0) {
      const countryIds = countries.map((c) => c.id)
      const citiesResult = await supabase
        .from("cities")
        .select(
          "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
        )
        .eq("is_active", true)
        .eq("is_popular", true)
        .in("country_id", countryIds)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      cities = ((citiesResult.data ?? []) as typeof cities) ?? []
      citiesError = citiesResult.error ?? null
    } else {
      cities = []
    }
  }

  if (countriesError) {
    const message = (countriesError as { message?: string } | null)?.message
    console.error("[locations] Failed to load countries for popular locations", message)
    return []
  }

  if (citiesError) {
    const message = (citiesError as { message?: string } | null)?.message
    console.error("[locations] Failed to load popular cities", message)
    return []
  }

  const countriesById = new Map<
    string,
    { id: string; code: string; name: string; sort_order: number | null }
  >()
  for (const c of countries) {
    countriesById.set(c.id, {
      id: c.id,
      code: c.code,
      name: c.name,
      sort_order: c.sort_order ?? 0,
    })
  }

  const groupsByCountryId = new Map<string, PopularLocationGroup>()

  for (const city of cities) {
    const country = countriesById.get(city.country_id)
    if (!country) continue

    const group =
      groupsByCountryId.get(country.id) ??
      (() => {
        const created: PopularLocationGroup = {
          country: (country.code ?? "").toUpperCase(),
          locations: [],
        }
        groupsByCountryId.set(country.id, created)
        return created
      })()

    if (wantsCitiesPerCountry && group.locations.length >= citiesPerCountry) {
      continue
    }

    group.locations.push({
      label: `Providers in ${city.name}`,
      href: buildLocationHref(country.code, city.slug),
    })
  }

  return Array.from(groupsByCountryId.entries())
    .sort((a, b) => {
      const ca = countriesById.get(a[0])
      const cb = countriesById.get(b[0])
      const orderA = ca?.sort_order ?? 0
      const orderB = cb?.sort_order ?? 0
      if (orderA !== orderB) return orderA - orderB
      const nameA = ca?.name ?? ""
      const nameB = cb?.name ?? ""
      return nameA.localeCompare(nameB)
    })
    .map(([, group]) => group)
}

export async function getCityBySlug(slug: string): Promise<CityRow | null> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select(
      "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active, countries(code)",
    )
    .eq("slug", slug)
    .maybeSingle<CityLookupRow>()

  if (error) {
    console.error("[locations] Failed to load city by slug", slug, error.message)
    return null
  }

  return data ? mapCityLookupRow(data) : null
}

export async function getCityByCountryAndSlug(
  countryCode: string,
  citySlug: string,
): Promise<CityRow | null> {
  const supabase = getSupabaseAdminClient()
  const normalizedCountry = countryCode.trim().toLowerCase()

  const { data, error } = await supabase
    .from("cities")
    .select(
      "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active, countries!inner(code, is_active)",
    )
    .eq("slug", citySlug)
    .eq("is_active", true)
    .eq("countries.is_active", true)
    .returns<CityLookupRow[]>()

  if (error) {
    console.error(
      "[locations] Failed to load city by country and slug",
      normalizedCountry,
      citySlug,
      error.message,
    )
    return null
  }

  const rows = (data ?? []) as CityLookupRow[]
  const matched = rows.find((row) => {
    const countryFromRelation =
      typeof row.countries?.code === "string" ? normalizeCountryCodeForPath(row.countries.code) : ""
    const countryFromSearch = normalizeCountryCodeForPath(row.search_country_code)
    return countryFromRelation === normalizedCountry || countryFromSearch === normalizedCountry
  })

  return matched ? mapCityLookupRow(matched) : null
}

export async function resolveLegacyCitySlugToCanonical(
  citySlug: string,
): Promise<LocationRouteParams | null> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select(
      "slug, search_country_code, countries!inner(code, is_active)",
    )
    .eq("slug", citySlug)
    .eq("is_active", true)
    .eq("countries.is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("[locations] Failed to resolve legacy city slug", citySlug, error.message)
    return null
  }

  const rows = (data ?? []) as Array<{
    slug: string
    search_country_code: string
    countries?: { code?: string | null } | null
  }>
  if (rows.length === 0) {
    return null
  }

  const mapped = rows.map((row) => ({
    country:
      (typeof row.countries?.code === "string" && row.countries.code.trim()
        ? normalizeCountryCodeForPath(row.countries.code)
        : normalizeCountryCodeForPath(row.search_country_code)),
    city: row.slug,
  }))

  const uniqueCountryCodes = new Set(mapped.map((item) => item.country))
  if (uniqueCountryCodes.size !== 1) {
    return null
  }

  return mapped[0] ?? null
}

export async function getActiveLocationRouteParams(): Promise<LocationRouteParams[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("cities")
    .select("slug, search_country_code, countries!inner(code, is_active)")
    .eq("is_active", true)
    .eq("countries.is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("[locations] Failed to build location route params", error.message)
    return []
  }

  const rows = (data ?? []) as Array<{
    slug: string
    search_country_code: string
    countries?: { code?: string | null } | null
  }>

  return rows.map((row) => ({
    country:
      (typeof row.countries?.code === "string" && row.countries.code.trim()
        ? normalizeCountryCodeForPath(row.countries.code)
        : normalizeCountryCodeForPath(row.search_country_code)),
    city: row.slug,
  }))
}

export async function getActiveCitiesByCountryCode(
  countryCode: string,
): Promise<Array<{ name: string; slug: string; country: string }>> {
  const supabase = getSupabaseAdminClient()
  const normalizedCountry = countryCode.trim().toLowerCase()
  const { data, error } = await supabase
    .from("cities")
    .select("name, slug, search_country_code, countries!inner(code, is_active)")
    .eq("is_active", true)
    .eq("countries.is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("[locations] Failed to list country cities", normalizedCountry, error.message)
    return []
  }

  const rows = (data ?? []) as Array<{
    name: string
    slug: string
    search_country_code: string
    countries?: { code?: string | null } | null
  }>
  return rows
    .filter((row) => {
      const countryFromRelation =
        typeof row.countries?.code === "string" ? normalizeCountryCodeForPath(row.countries.code) : ""
      const countryFromSearch = normalizeCountryCodeForPath(row.search_country_code)
      return countryFromRelation === normalizedCountry || countryFromSearch === normalizedCountry
    })
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      country:
        (typeof row.countries?.code === "string" && row.countries.code.trim()
          ? normalizeCountryCodeForPath(row.countries.code)
          : normalizeCountryCodeForPath(row.search_country_code)),
    }))
}

export type FooterCityLink = {
  name: string
  href: string
}

const FOOTER_CITY_FALLBACK: FooterCityLink[] = [
  { name: "London", href: "/locations/uk/london" },
  { name: "Dubai", href: "/locations/ae/dubai" },
  { name: "New York", href: "/locations/us/new-york" },
  { name: "Los Angeles", href: "/locations/us/los-angeles" },
  { name: "Chicago", href: "/locations/us/chicago" },
  { name: "Miami", href: "/locations/us/miami" },
  { name: "San Francisco", href: "/locations/us/san-francisco" },
]

function shuffleInPlace<T>(arr: T[], random: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

/**
 * Up to `limit` random active cities for the site footer (Fisher–Yates on the active set).
 * Cached cross-request so the root layout stays static/ISR-eligible (no per-request Math.random).
 */
export async function getRandomFooterCities(limit: number): Promise<FooterCityLink[]> {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdminClient()

      const { data, error } = await supabase
        .from("cities")
        .select("name, slug, search_country_code, countries!inner(code, is_active)")
        .eq("is_active", true)
        .eq("countries.is_active", true)

      if (error) {
        console.error("[locations] Failed to load cities for footer", error.message)
        return FOOTER_CITY_FALLBACK
      }

      const rows = (data ?? []) as Array<{
        name: string
        slug: string
        search_country_code: string
        countries?: { code?: string | null } | null
      }>
      if (rows.length === 0) {
        return FOOTER_CITY_FALLBACK
      }

      shuffleInPlace(rows, Math.random)
      const take = Math.min(limit, rows.length)
      return rows.slice(0, take).map((c) => ({
        name: c.name,
        href: buildLocationHref(
          (typeof c.countries?.code === "string" && c.countries.code.trim()
            ? c.countries.code
            : c.search_country_code),
          c.slug,
        ),
      }))
    },
    ["footer-cities", String(limit)],
    { revalidate: 3600, tags: [CACHE_TAGS.footerCities] },
  )()
}

function footerFallbackForMarket(market: MarketId): FooterCityLink[] {
  const uk = FOOTER_CITY_FALLBACK.filter((l) => l.href.includes("/locations/uk/"))
  const us = FOOTER_CITY_FALLBACK.filter((l) => l.href.includes("/locations/us/"))
  const ae = FOOTER_CITY_FALLBACK.filter((l) => l.href.includes("/locations/ae/"))
  if (market === "uk") return uk.length > 0 ? uk : FOOTER_CITY_FALLBACK
  if (market === "us") return us.length > 0 ? us : FOOTER_CITY_FALLBACK
  if (market === "uae") return ae.length > 0 ? ae : FOOTER_CITY_FALLBACK
  return FOOTER_CITY_FALLBACK
}

/**
 * Random footer cities biased to the visitor’s selected market (UK / US / UAE).
 */
export async function getRandomFooterCitiesForMarket(
  limit: number,
  market: MarketId,
): Promise<FooterCityLink[]> {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdminClient()

      const { data, error } = await supabase
        .from("cities")
        .select("name, slug, search_country_code, countries!inner(code, is_active)")
        .eq("is_active", true)
        .eq("countries.is_active", true)

      if (error) {
        console.error("[locations] Failed to load cities for footer (market)", error.message)
        return footerFallbackForMarket(market).slice(0, limit)
      }

      const rows = (data ?? []) as Array<{
        name: string
        slug: string
        search_country_code: string
        countries?: { code?: string | null } | null
      }>
      if (rows.length === 0) {
        return footerFallbackForMarket(market).slice(0, limit)
      }

      const filtered = rows.filter((row) =>
        cityRowMatchesMarket(
          typeof row.countries?.code === "string" ? row.countries.code : null,
          row.search_country_code,
          market,
        ),
      )

      const pool = filtered.length > 0 ? filtered : rows
      shuffleInPlace(pool, Math.random)
      const take = Math.min(limit, pool.length)
      const mapped = pool.slice(0, take).map((c) => ({
        name: c.name,
        href: buildLocationHref(
          typeof c.countries?.code === "string" && c.countries.code.trim()
            ? c.countries.code
            : c.search_country_code,
          c.slug,
        ),
      }))

      if (mapped.length > 0) return mapped
      return footerFallbackForMarket(market).slice(0, limit)
    },
    ["footer-cities-market", market, String(limit)],
    { revalidate: 3600, tags: [CACHE_TAGS.footerCities] },
  )()
}

