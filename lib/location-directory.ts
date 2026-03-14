import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export interface CountryOption {
  id: string
  code: string
  name: string
}

export interface CityOption {
  id: string
  countryId: string
  name: string
  slug: string
  searchCountryCode: string
  searchCitySlug: string
}

export async function getCountriesForSignup(): Promise<CountryOption[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("countries")
    .select("id, code, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error || !data) {
    console.error("[location-directory] Failed to load countries for signup", error?.message)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
  }))
}

export async function getCitiesForSignupByCountry(countryId: string): Promise<CityOption[]> {
  if (!countryId) return []

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select(
      "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
    )
    .eq("is_active", true)
    .eq("country_id", countryId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error || !data) {
    console.error(
      "[location-directory] Failed to load cities for signup by country",
      countryId,
      error?.message,
    )
    return []
  }

  return data.map((row) => ({
    id: row.id,
    countryId: row.country_id,
    name: row.name,
    slug: row.slug,
    searchCountryCode: row.search_country_code,
    searchCitySlug: row.search_city_slug,
  }))
}

