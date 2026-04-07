import "server-only"

import { unstable_cache } from "next/cache"
import { geocodeAddressToCoordinates } from "@/lib/geocode-server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { VisitorGeo } from "@/lib/visitor-geo"

async function lookupCountryCodeByName(countryName: string): Promise<string | null> {
  const t = countryName.trim()
  if (!t) return null

  const supabase = getSupabaseAdminClient()

  const exact = await supabase
    .from("countries")
    .select("code")
    .ilike("name", t)
    .eq("is_active", true)
    .maybeSingle()

  const codeExact = exact.data?.code
  if (typeof codeExact === "string" && codeExact.trim()) {
    return codeExact.trim().toUpperCase()
  }

  const fuzzy = await supabase
    .from("countries")
    .select("code")
    .ilike("name", `%${t}%`)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  const codeFuzzy = fuzzy.data?.code
  if (typeof codeFuzzy === "string" && codeFuzzy.trim()) {
    return codeFuzzy.trim().toUpperCase()
  }

  const byCode = await supabase
    .from("countries")
    .select("code")
    .ilike("code", t)
    .eq("is_active", true)
    .maybeSingle()

  const codeByCode = byCode.data?.code
  if (typeof codeByCode === "string" && codeByCode.trim()) {
    return codeByCode.trim().toUpperCase()
  }

  return null
}

function primaryCityLabel(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  const first = t.split(",")[0]?.trim() ?? t
  return first || t
}

async function resolveParentVisitorGeoInner(city: string, country: string): Promise<VisitorGeo | null> {
  const countryCode = country ? await lookupCountryCodeByName(country) : null

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  let latitude: number | null = null
  let longitude: number | null = null
  if (apiKey?.trim()) {
    const address = [city, country].filter(Boolean).join(", ")
    if (address.trim()) {
      const coords = await geocodeAddressToCoordinates(address, apiKey)
      if (coords) {
        latitude = coords.lat
        longitude = coords.lng
      }
    }
    if (
      (latitude === null || longitude === null) &&
      primaryCityLabel(city) &&
      !country.trim()
    ) {
      const coordsCityOnly = await geocodeAddressToCoordinates(primaryCityLabel(city), apiKey)
      if (coordsCityOnly) {
        latitude = coordsCityOnly.lat
        longitude = coordsCityOnly.lng
      }
    }
  }

  const cityForMatch = primaryCityLabel(city) || null
  const hasCoords =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  if (!countryCode && !hasCoords && !cityForMatch) {
    return null
  }

  return {
    city: cityForMatch,
    countryCode,
    latitude,
    longitude,
  }
}

/**
 * Maps parent profile city/country to {@link VisitorGeo} for dashboard recommendations.
 * Cached per city+country pair to avoid repeated geocoding.
 */
export async function resolveParentVisitorGeo(
  cityName: string | null,
  countryName: string | null
): Promise<VisitorGeo | null> {
  const city = cityName?.trim() ?? ""
  const country = countryName?.trim() ?? ""
  if (!city && !country) return null

  return unstable_cache(
    () => resolveParentVisitorGeoInner(city, country),
    ["parent-visitor-geo-v1", city, country],
    { revalidate: 86400 }
  )()
}
