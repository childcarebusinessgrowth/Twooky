import type { ProviderCardData } from "@/components/provider-card"
import type { GoogleMapsNamespace } from "@/lib/google-maps-loader"

/**
 * Shared helpers for turning providers into pins on the search map components.
 * Used by `SearchMapPanel` and `SearchMapModal` so both maps render the same set
 * of markers, with the same client-side geocode fallback for providers whose
 * coordinates aren't yet stored in the DB.
 */

export type ProviderMapPoint = {
  provider: ProviderCardData
  latitude: number
  longitude: number
}

export function toCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function hasValidCoordinates(latitude: unknown, longitude: unknown): boolean {
  const lat = toCoordinate(latitude)
  const lng = toCoordinate(longitude)
  if (lat === null || lng === null) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

export function toMapPoint(provider: ProviderCardData): ProviderMapPoint | null {
  const lat = toCoordinate(provider.latitude)
  const lng = toCoordinate(provider.longitude)
  if (lat === null || lng === null) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  if (lat === 0 && lng === 0) return null
  return { provider, latitude: lat, longitude: lng }
}

export function partitionProviderMapPoints(providers: ProviderCardData[]): {
  directPoints: ProviderMapPoint[]
  missingCoordinateProviders: ProviderCardData[]
} {
  const directPoints: ProviderMapPoint[] = []
  const missingCoordinateProviders: ProviderCardData[] = []

  for (const provider of providers) {
    const directPoint = toMapPoint(provider)
    if (directPoint) {
      directPoints.push(directPoint)
      continue
    }
    missingCoordinateProviders.push(provider)
  }

  return { directPoints, missingCoordinateProviders }
}

async function geocodeProviderAddress(
  maps: GoogleMapsNamespace,
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const geocoder = new maps.Geocoder()
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        resolve(null)
        return
      }
      const location = results[0].geometry?.location
      if (!location) {
        resolve(null)
        return
      }
      const lat = location.lat()
      const lng = location.lng()
      if (!hasValidCoordinates(lat, lng)) {
        resolve(null)
        return
      }
      resolve({ lat, lng })
    })
  })
}

/**
 * Resolves map points for providers without stored coordinates by geocoding
 * their addresses. Results stream into `onBatchResolved` as each batch finishes
 * so the map can show markers progressively.
 *
 * The backfill script plus server-side geocoding on save should make this path
 * rare; the cap is set generously so stragglers still render reliably.
 */
export async function resolveProviderMapPoints(
  maps: GoogleMapsNamespace,
  providers: ProviderCardData[],
  geocodeCache: Map<string, { lat: number; lng: number } | null>,
  onBatchResolved: (points: ProviderMapPoint[]) => void,
  options: { maxLookups?: number; concurrency?: number } = {},
): Promise<void> {
  const maxLookups = options.maxLookups ?? 500
  const concurrency = Math.max(1, Math.min(8, options.concurrency ?? 4))

  const cachedPoints: ProviderMapPoint[] = []
  const providersByAddress = new Map<string, ProviderCardData[]>()
  let geocodeLookups = 0

  for (const provider of providers) {
    const directPoint = toMapPoint(provider)
    if (directPoint) {
      cachedPoints.push(directPoint)
      continue
    }

    const address = (provider.address || provider.location || "").trim()
    if (!address) continue

    const cachedCoords = geocodeCache.get(address)
    if (cachedCoords !== undefined) {
      if (cachedCoords && hasValidCoordinates(cachedCoords.lat, cachedCoords.lng)) {
        cachedPoints.push({ provider, latitude: cachedCoords.lat, longitude: cachedCoords.lng })
      }
      continue
    }

    const existingProviders = providersByAddress.get(address)
    if (existingProviders) {
      existingProviders.push(provider)
      continue
    }

    if (geocodeLookups >= maxLookups) continue
    geocodeLookups += 1
    providersByAddress.set(address, [provider])
  }

  if (cachedPoints.length > 0) {
    onBatchResolved(cachedPoints)
  }

  const pendingAddresses = Array.from(providersByAddress.entries())
  for (let index = 0; index < pendingAddresses.length; index += concurrency) {
    const chunk = pendingAddresses.slice(index, index + concurrency)
    const resolvedPointsGroups = await Promise.all(
      chunk.map(async ([address, providersForAddress]) => {
        const coords = await geocodeProviderAddress(maps, address)
        geocodeCache.set(address, coords)
        if (!coords || !hasValidCoordinates(coords.lat, coords.lng)) return []
        return providersForAddress.map((provider) => ({
          provider,
          latitude: coords.lat,
          longitude: coords.lng,
        }))
      }),
    )

    const batchPoints = resolvedPointsGroups.flat()
    if (batchPoints.length > 0) {
      onBatchResolved(batchPoints)
    }
  }
}
