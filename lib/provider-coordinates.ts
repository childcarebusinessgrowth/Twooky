import "server-only"

import { fetchGooglePlaceDetailsSummary } from "@/lib/google-place-reviews"
import { geocodeAddressToCoordinates } from "@/lib/geocode-server"

export type ResolveProviderCoordinatesInput = {
  placeId?: string | null
  address?: string | null
  businessName?: string | null
  logContext?: string
}

export type ProviderCoordinates = {
  lat: number
  lng: number
}

function getGoogleMapsApiKey(): string | null {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  return apiKey || null
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isValidCoordinates(lat: unknown, lng: unknown): lat is number {
  if (!isFiniteCoord(lat) || !isFiniteCoord(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

/**
 * Resolve provider coordinates using Google Place Details first (when a place id is present),
 * then falling back to the forward Geocoding API for the provider's address.
 * Never throws; returns null on any failure so callers can skip writing.
 */
export async function resolveProviderCoordinates(
  input: ResolveProviderCoordinatesInput
): Promise<ProviderCoordinates | null> {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) return null

  const context = input.logContext?.trim() || "provider-coordinates"
  const placeId = input.placeId?.trim() || ""
  const address = input.address?.trim() || ""
  const businessName = input.businessName?.trim() || ""

  if (placeId) {
    try {
      const summary = await fetchGooglePlaceDetailsSummary(placeId, apiKey)
      if (summary && isValidCoordinates(summary.latitude, summary.longitude)) {
        return { lat: summary.latitude as number, lng: summary.longitude as number }
      }
    } catch (error) {
      console.warn(`[${context}] place-details coord lookup failed`, error)
    }
  }

  const addressQuery = [businessName, address].filter(Boolean).join(", ") || address
  if (!addressQuery) return null

  try {
    const coords = await geocodeAddressToCoordinates(addressQuery, apiKey)
    if (coords && isValidCoordinates(coords.lat, coords.lng)) {
      return { lat: coords.lat, lng: coords.lng }
    }
  } catch (error) {
    console.warn(`[${context}] geocode fallback failed`, error)
  }

  return null
}

type MinimalSupabaseClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data:
            | {
                address?: string | null
                google_place_id?: string | null
                latitude?: number | null
                longitude?: number | null
              }
            | null
          error: { message: string } | null
        }>
      }
    }
  }
}

export type SyncProviderCoordinatesInput = {
  supabase: MinimalSupabaseClient
  providerProfileId: string
  address?: string | null
  placeId?: string | null
  businessName?: string | null
  logContext?: string
  /** When true, re-resolve even if coordinates are already set. */
  force?: boolean
}

/**
 * Fetches the provider's current coords/address, and if missing or address changed,
 * resolves new coordinates and writes them to provider_profiles.
 * Safe to call after any insert/update/upsert on provider_profiles.
 */
export async function syncProviderCoordinates(
  input: SyncProviderCoordinatesInput
): Promise<ProviderCoordinates | null> {
  const context = input.logContext?.trim() || "sync-provider-coordinates"
  const providerProfileId = input.providerProfileId.trim()
  if (!providerProfileId) return null

  const trimmedAddress = input.address?.trim() ?? null
  const trimmedPlaceId = input.placeId?.trim() ?? null

  try {
    const { data: existing } = await input.supabase
      .from("provider_profiles")
      .select("address, google_place_id, latitude, longitude")
      .eq("profile_id", providerProfileId)
      .maybeSingle()

    const effectiveAddress = trimmedAddress ?? existing?.address?.trim() ?? null
    const effectivePlaceId = trimmedPlaceId ?? existing?.google_place_id?.trim() ?? null

    const hasValidExisting =
      isFiniteCoord(existing?.latitude ?? null) &&
      isFiniteCoord(existing?.longitude ?? null) &&
      !(existing?.latitude === 0 && existing?.longitude === 0)

    if (!input.force && hasValidExisting) {
      return {
        lat: existing!.latitude as number,
        lng: existing!.longitude as number,
      }
    }

    const coords = await resolveProviderCoordinates({
      placeId: effectivePlaceId,
      address: effectiveAddress,
      businessName: input.businessName,
      logContext: context,
    })

    if (!coords) return null

    const { error } = await input.supabase
      .from("provider_profiles")
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq("profile_id", providerProfileId)

    if (error) {
      if (!error.message.toLowerCase().includes("column")) {
        console.warn(`[${context}] failed to persist coords`, error.message)
      }
      return null
    }

    return coords
  } catch (error) {
    console.warn(`[${context}] syncProviderCoordinates failed`, error)
    return null
  }
}
