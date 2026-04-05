"use client"

export type GeolocationErrorCode =
  | "unsupported"
  | "permission-denied"
  | "position-unavailable"
  | "timeout"
  | "unknown"

export class GeolocationError extends Error {
  code: GeolocationErrorCode

  constructor(code: GeolocationErrorCode, message: string) {
    super(message)
    this.name = "GeolocationError"
    this.code = code
  }
}

export type UserCoordinates = {
  lat: number
  lng: number
}

export const CLIENT_LOCATION_CACHE_KEY = "eld:client-location-cache"
export const CLIENT_LOCATION_UPDATED_EVENT = "eld:client-location-updated"

export type ClientLocationCacheValue = {
  locationText: string
  city?: string
  state?: string
  countryCode?: string
  lat?: number
  lng?: number
  updatedAt: number
}

type ReverseGeocodeResult = {
  locationText: string
  city?: string
  state?: string
  countryCode?: string
  postalCode?: string
  formattedAddress?: string
}

type GeocodeAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GeocodeResponseResult = {
  formatted_address?: string
  address_components?: GeocodeAddressComponent[]
}

type GeocodeResponse = {
  status?: string
  error_message?: string
  results?: GeocodeResponseResult[]
}

export function getGeolocationErrorMessage(code: GeolocationErrorCode): string {
  switch (code) {
    case "unsupported":
      return "Your browser does not support location detection."
    case "permission-denied":
      return "Location permission was denied. Please allow access and try again."
    case "position-unavailable":
      return "We could not determine your location. Please try again."
    case "timeout":
      return "Getting your location took too long. Please try again."
    case "unknown":
    default:
      return "Unable to detect your location right now."
  }
}

export function getCurrentPosition(options?: PositionOptions): Promise<UserCoordinates> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    throw new GeolocationError("unsupported", getGeolocationErrorMessage("unsupported"))
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new GeolocationError(
      "unsupported",
      "Location access requires a secure context (HTTPS or localhost).",
    )
  }
  if (typeof window !== "undefined" && window.top !== window.self) {
    throw new GeolocationError(
      "permission-denied",
      "Location access is blocked in embedded preview. Open the app in a browser tab.",
    )
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        if (error.code === 1) {
          reject(new GeolocationError("permission-denied", getGeolocationErrorMessage("permission-denied")))
          return
        }
        if (error.code === 2) {
          reject(new GeolocationError("position-unavailable", getGeolocationErrorMessage("position-unavailable")))
          return
        }
        if (error.code === 3) {
          reject(new GeolocationError("timeout", getGeolocationErrorMessage("timeout")))
          return
        }
        reject(
          new GeolocationError(
            "unknown",
            error.message || getGeolocationErrorMessage("unknown"),
          ),
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options,
      },
    )
  })
}

function pickComponent(components: GeocodeAddressComponent[], type: string): GeocodeAddressComponent | undefined {
  return components.find((component) => component.types.includes(type))
}

function formatLocationText(city?: string, state?: string, postalCode?: string, formattedAddress?: string): string {
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  if (postalCode) return postalCode
  return formattedAddress ?? ""
}

export async function reverseGeocodeCoordinates(
  coordinates: UserCoordinates,
  apiKey: string,
): Promise<ReverseGeocodeResult> {
  const query = new URLSearchParams({
    latlng: `${coordinates.lat},${coordinates.lng}`,
    key: apiKey,
  })

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Reverse geocoding request failed.")
  }

  const payload = (await response.json()) as GeocodeResponse
  if (payload.status !== "OK" || !payload.results || payload.results.length === 0) {
    throw new Error(payload.error_message || "Unable to resolve a location name from coordinates.")
  }

  const primaryResult = payload.results[0]
  const components = primaryResult.address_components ?? []
  const cityComponent =
    pickComponent(components, "locality") ||
    pickComponent(components, "postal_town") ||
    pickComponent(components, "administrative_area_level_2")
  const stateComponent = pickComponent(components, "administrative_area_level_1")
  const countryComponent = pickComponent(components, "country")
  const postalComponent = pickComponent(components, "postal_code")

  const city = cityComponent?.long_name
  const state = stateComponent?.short_name ?? stateComponent?.long_name
  const countryCode = countryComponent?.short_name?.toUpperCase()
  const postalCode = postalComponent?.long_name
  const formattedAddress = primaryResult.formatted_address
  const locationText = formatLocationText(city, state, postalCode, formattedAddress)

  if (!locationText) {
    throw new Error("Unable to format a readable location.")
  }

  return {
    locationText,
    city,
    state,
    countryCode,
    postalCode,
    formattedAddress,
  }
}

export function readClientLocationCache(): ClientLocationCacheValue | null {
  if (typeof window === "undefined") return null
  const raw = window.sessionStorage.getItem(CLIENT_LOCATION_CACHE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ClientLocationCacheValue>
    if (!parsed || typeof parsed.locationText !== "string" || typeof parsed.updatedAt !== "number") {
      return null
    }
    return {
      locationText: parsed.locationText,
      city: typeof parsed.city === "string" ? parsed.city : undefined,
      state: typeof parsed.state === "string" ? parsed.state : undefined,
      countryCode: typeof parsed.countryCode === "string" ? parsed.countryCode : undefined,
      lat: typeof parsed.lat === "number" ? parsed.lat : undefined,
      lng: typeof parsed.lng === "number" ? parsed.lng : undefined,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

export function writeClientLocationCache(value: Omit<ClientLocationCacheValue, "updatedAt">): void {
  if (typeof window === "undefined") return
  const payload: ClientLocationCacheValue = { ...value, updatedAt: Date.now() }
  window.sessionStorage.setItem(CLIENT_LOCATION_CACHE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent(CLIENT_LOCATION_UPDATED_EVENT, { detail: payload }))
}
