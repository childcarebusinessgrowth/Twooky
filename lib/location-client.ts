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

type ReverseGeocodeResult = {
  locationText: string
  city?: string
  state?: string
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
  const postalComponent = pickComponent(components, "postal_code")

  const city = cityComponent?.long_name
  const state = stateComponent?.short_name ?? stateComponent?.long_name
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
    postalCode,
    formattedAddress,
  }
}
