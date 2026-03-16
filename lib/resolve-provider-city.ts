import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { getCountryById } from "@/lib/location-directory"
import { getCitiesForSignupByCountry } from "@/lib/location-directory"
import { slugifyCityName } from "@/lib/city-slug"

export type ResolveProviderCityPayload = {
  countryId: string
  cityId?: string
  customCityName?: string
}

export type ResolvedProviderLocation = {
  countryId: string
  cityId: string
  countryName: string
  cityName: string
}

/**
 * Resolves provider location: either use existing city by id or create a new city from customCityName.
 * Returns country and city ids and display names for profiles/provider_profiles.
 */
export async function resolveProviderLocation(
  admin: SupabaseClient,
  payload: ResolveProviderCityPayload,
): Promise<ResolvedProviderLocation> {
  const { countryId, cityId, customCityName } = payload

  const country = await getCountryById(countryId)
  if (!country) {
    throw new Error("Invalid country.")
  }

  if (cityId) {
    const cities = await getCitiesForSignupByCountry(countryId)
    const city = cities.find((c) => c.id === cityId)
    if (!city) {
      throw new Error("Invalid city.")
    }
    return {
      countryId,
      cityId: city.id,
      countryName: country.name,
      cityName: city.name,
    }
  }

  const customName = customCityName?.trim()
  if (!customName) {
    throw new Error("Either city or custom city name is required.")
  }

  const customNameLower = customName.toLowerCase()

  const { data: existingCities } = await admin
    .from("cities")
    .select("id, name")
    .eq("country_id", countryId)
    .eq("is_active", true)

  const existingSameName = existingCities?.find(
    (c) => c.name.trim().toLowerCase() === customNameLower,
  )
  if (existingSameName) {
    return {
      countryId,
      cityId: existingSameName.id,
      countryName: country.name,
      cityName: existingSameName.name,
    }
  }

  const baseSlug = slugifyCityName(customName)
  if (!baseSlug) {
    throw new Error("Invalid city name.")
  }

  const countryCode = country.code.trim().toLowerCase()

  const { data: existingBySlug } = await admin
    .from("cities")
    .select("id")
    .eq("slug", baseSlug)
    .limit(1)
    .maybeSingle()

  const slug = existingBySlug ? `${baseSlug}-${countryCode}` : baseSlug

  const { data: inserted, error } = await admin
    .from("cities")
    .insert({
      country_id: countryId,
      name: customName,
      slug,
      search_country_code: countryCode,
      search_city_slug: slug,
      is_popular: false,
      sort_order: 9999,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: bySlug } = await admin
        .from("cities")
        .select("id, name")
        .eq("slug", slug)
        .eq("country_id", countryId)
        .maybeSingle()
      if (bySlug) {
        return {
          countryId,
          cityId: bySlug.id,
          countryName: country.name,
          cityName: bySlug.name,
        }
      }
    }
    console.error("[resolve-provider-city] Insert city failed:", error.message)
    throw new Error("Unable to save city. Please try again.")
  }

  return {
    countryId,
    cityId: inserted.id,
    countryName: country.name,
    cityName: customName,
  }
}
