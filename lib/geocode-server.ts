import "server-only"
import { fetchWithTimeout } from "@/lib/fetch-with-timeout"

/**
 * Server-only forward geocoding to validate that a city name exists and lies in the given country.
 * Uses Google Geocoding API when GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.
 */

type AddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GeocodeResult = {
  address_components?: AddressComponent[]
  formatted_address?: string
  geometry?: {
    location?: { lat: number; lng: number }
  }
}

type GeocodeResponse = {
  status?: string
  error_message?: string
  results?: GeocodeResult[]
}

function pickComponent(components: AddressComponent[], type: string): AddressComponent | undefined {
  return components.find((c) => c.types.includes(type))
}

/**
 * Returns canonical city name from the first result if the result is in the given country; otherwise null.
 */
export async function validateCityInCountry(
  cityName: string,
  countryName: string,
  apiKey: string | undefined,
): Promise<{ valid: true; canonicalName: string } | { valid: false; error: string }> {
  if (!apiKey?.trim()) {
    return { valid: false, error: "Geocoding is not configured." }
  }

  const query = new URLSearchParams({
    address: `${cityName.trim()}, ${countryName.trim()}`,
    key: apiKey,
  })

  const response = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
    10_000,
  ).catch(() => null)

  if (!response?.ok) {
    return { valid: false, error: "Could not verify city. Please try again." }
  }

  const payload = (await response.json()) as GeocodeResponse

  if (payload.status !== "OK" || !payload.results?.length) {
    return {
      valid: false,
      error: payload.error_message || "We couldn't find that city in the selected country.",
    }
  }

  const primary = payload.results[0]
  const components = primary.address_components ?? []
  const countryComponent = pickComponent(components, "country")

  if (!countryComponent) {
    return { valid: false, error: "We couldn't confirm the country for that city." }
  }

  const resultCountryName = countryComponent.long_name
  if (resultCountryName.toLowerCase() !== countryName.toLowerCase()) {
    return {
      valid: false,
      error: `That city appears to be in ${resultCountryName}, not ${countryName}.`,
    }
  }

  const locality =
    pickComponent(components, "locality") ||
    pickComponent(components, "postal_town") ||
    pickComponent(components, "administrative_area_level_2") ||
    pickComponent(components, "administrative_area_level_1")

  const canonicalName = locality?.long_name ?? cityName.trim()

  return { valid: true, canonicalName }
}

/**
 * Forward geocode an address to coordinates.
 * Returns { lat, lng } from the first result, or null if no results.
 */
export async function geocodeAddressToCoordinates(
  address: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!apiKey?.trim() || !address?.trim()) {
    return null
  }

  const query = new URLSearchParams({
    address: address.trim(),
    key: apiKey,
  })

  const response = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
    10_000,
  ).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const payload = (await response.json()) as GeocodeResponse

  if (payload.status !== "OK" || !payload.results?.length) {
    return null
  }

  const location = payload.results[0].geometry?.location
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    return null
  }

  return { lat: location.lat, lng: location.lng }
}
