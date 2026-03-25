import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { PopularLocationGroup } from "@/lib/popular-locations"

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
          "id, country_id, name, search_country_code, search_city_slug, is_popular, sort_order, is_active",
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
          "id, country_id, name, search_country_code, search_city_slug, is_popular, sort_order, is_active",
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
      label: `Childcares in ${city.name}`,
      href: `/search?country=${city.search_country_code}&city=${city.search_city_slug}`,
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
      "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
    )
    .eq("slug", slug)
    .maybeSingle<CityRow>()

  if (error) {
    console.error("[locations] Failed to load city by slug", slug, error.message)
    return null
  }

  return data ?? null
}

