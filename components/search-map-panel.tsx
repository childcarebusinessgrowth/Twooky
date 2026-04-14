"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ProviderCardData } from "@/components/provider-card"
import { getCurrentPosition } from "@/lib/location-client"
import {
  loadGoogleMapsApi,
  type GoogleInfoWindowInstance,
  type GoogleLatLngBoundsInstance,
  type GoogleMapInstance,
  type GoogleMapsNamespace,
  type GoogleMarkerInstance,
} from "@/lib/google-maps-loader"
import { createProviderPinDataUri } from "@/lib/map-pin-utils"

type SearchMapPanelProps = {
  providers: ProviderCardData[]
  className?: string
  /** When set (e.g. from URL), geocode and frame the map on this place instead of fitting all pins worldwide. */
  searchLocation?: string
}

type ProviderMapPoint = {
  provider: ProviderCardData
  latitude: number
  longitude: number
}

async function geocodeSearchAddress(
  maps: GoogleMapsNamespace,
  address: string,
): Promise<
  | { kind: "viewport"; viewport: GoogleLatLngBoundsInstance }
  | { kind: "center"; center: { lat: number; lng: number } }
  | null
> {
  const geocoder = new maps.Geocoder()
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        resolve(null)
        return
      }
      const geom = results[0].geometry
      if (geom.viewport) {
        resolve({ kind: "viewport", viewport: geom.viewport })
        return
      }
      if (geom.location) {
        resolve({
          kind: "center",
          center: { lat: geom.location.lat(), lng: geom.location.lng() },
        })
        return
      }
      resolve(null)
    })
  })
}

function toCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function hasValidCoordinates(latitude: unknown, longitude: unknown): boolean {
  const lat = toCoordinate(latitude)
  const lng = toCoordinate(longitude)
  if (lat === null || lng === null) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

function toMapPoint(provider: ProviderCardData): ProviderMapPoint | null {
  const lat = toCoordinate(provider.latitude)
  const lng = toCoordinate(provider.longitude)
  if (lat === null || lng === null) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  if (lat === 0 && lng === 0) return null
  return { provider, latitude: lat, longitude: lng }
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

async function resolveProviderMapPoints(
  maps: GoogleMapsNamespace,
  providers: ProviderCardData[],
  geocodeCache: Map<string, { lat: number; lng: number } | null>,
): Promise<ProviderMapPoint[]> {
  const MAX_GEOCODE_LOOKUPS = 40
  const points: ProviderMapPoint[] = []
  let geocodeLookups = 0

  for (const provider of providers) {
    const directPoint = toMapPoint(provider)
    if (directPoint) {
      points.push(directPoint)
      continue
    }

    if (geocodeLookups >= MAX_GEOCODE_LOOKUPS) continue
    const address = (provider.address || provider.location || "").trim()
    if (!address) continue

    let coords = geocodeCache.get(address)
    if (coords === undefined) {
      geocodeLookups += 1
      coords = await geocodeProviderAddress(maps, address)
      geocodeCache.set(address, coords)
    }

    if (coords && hasValidCoordinates(coords.lat, coords.lng)) {
      points.push({ provider, latitude: coords.lat, longitude: coords.lng })
    }
  }

  return points
}

function fallbackCenterFromProviders(providers: ProviderMapPoint[]): { lat: number; lng: number } {
  const withCoords = providers
  if (withCoords.length === 0) {
    return { lat: 39.8283, lng: -98.5795 }
  }

  const sums = withCoords.reduce(
    (acc, provider) => ({
      lat: acc.lat + provider.latitude,
      lng: acc.lng + provider.longitude,
    }),
    { lat: 0, lng: 0 },
  )

  return {
    lat: sums.lat / withCoords.length,
    lng: sums.lng / withCoords.length,
  }
}

function fallbackCenterFromRawProviders(providers: ProviderCardData[]): { lat: number; lng: number } {
  const withCoords = providers
    .map((provider) => toMapPoint(provider))
    .filter((point): point is ProviderMapPoint => point != null)
  return fallbackCenterFromProviders(withCoords)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function SearchMapPanel({
  providers,
  className = "",
  searchLocation,
}: SearchMapPanelProps) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null)
  const markerByProviderIdRef = useRef<Map<string, GoogleMarkerInstance>>(new Map())
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number } | null>>(new Map())
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null)

  const defaultCenter = useMemo(() => fallbackCenterFromRawProviders(providers), [providers])

  useEffect(() => {
    let isMounted = true
    void getCurrentPosition({ timeout: 5000 })
      .then((coords) => {
        if (isMounted) {
          setUserCenter(coords)
        }
      })
      .catch(() => {
        // Optional enhancement only; failures here should not block map rendering.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!mapsApiKey) {
      setMapError("Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.")
      return
    }

    if (!mapContainerRef.current) return

    let isCancelled = false
    setMapError(null)
    setIsLoadingMap(true)

    const initializeMap = async () => {
      try {
        const maps = await loadGoogleMapsApi(mapsApiKey)
        if (isCancelled || !mapContainerRef.current) return

        const trimmedSearch = searchLocation?.trim() ?? ""
        const geoResult =
          trimmedSearch.length > 0
            ? await geocodeSearchAddress(maps, trimmedSearch)
            : null

        const usedSearchArea = geoResult?.kind === "viewport" || geoResult?.kind === "center"

        const center =
          geoResult?.kind === "center"
            ? geoResult.center
            : userCenter ?? defaultCenter

        const map = new maps.Map(mapContainerRef.current, {
          center,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        mapRef.current = map

        if (geoResult?.kind === "viewport") {
          map.fitBounds(geoResult.viewport, 80)
        } else if (geoResult?.kind === "center") {
          map.setCenter(geoResult.center)
          map.setZoom(12)
        }

        const infoWindow = new maps.InfoWindow()
        infoWindowRef.current = infoWindow
        markerByProviderIdRef.current.clear()

        const resolvedMapProviders = await resolveProviderMapPoints(
          maps,
          providers,
          geocodeCacheRef.current,
        )
        const bounds = new maps.LatLngBounds()

        resolvedMapProviders.forEach(({ provider, latitude, longitude }) => {
          const marker = new maps.Marker({
            map,
            position: {
              lat: latitude,
              lng: longitude,
            },
            title: provider.name,
            icon: {
              url: createProviderPinDataUri(),
              scaledSize: new maps.Size(42, 54),
              anchor: new maps.Point(21, 51),
            },
          })

          const providerId = String(provider.id)
          markerByProviderIdRef.current.set(providerId, marker)
          bounds.extend({ lat: latitude, lng: longitude })

          const locationText = provider.address || provider.location
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div style="padding:8px 10px;max-width:220px;">
                <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(provider.name)}</div>
                <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${escapeHtml(locationText)}</div>
                <a href="/providers/${escapeHtml(provider.slug)}" style="font-size:12px;color:#203e68;text-decoration:none;font-weight:600;">View details</a>
              </div>`,
            )
            infoWindow.open({ map, anchor: marker })
          })
        })

        if (resolvedMapProviders.length > 1) {
          // Prioritize the actual provider marker spread so nearby matches do not visually collapse
          // into a single pin when a broad location viewport (e.g. "London") is used.
          map.fitBounds(bounds, 80)
        } else if (resolvedMapProviders.length === 1) {
          map.setCenter({
            lat: resolvedMapProviders[0].latitude,
            lng: resolvedMapProviders[0].longitude,
          })
          map.setZoom(13)
        } else if (!usedSearchArea) {
          map.setCenter(center)
          map.setZoom(10)
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to initialize map. Please try again."
        setMapError(message)
      } finally {
        if (!isCancelled) {
          setIsLoadingMap(false)
        }
      }
    }

    void initializeMap()

    return () => {
      isCancelled = true
    }
  }, [defaultCenter, mapsApiKey, providers, searchLocation, userCenter])

  return (
    <section className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      <div className="relative h-[320px] w-full md:h-[360px] lg:h-[400px]">
        <div ref={mapContainerRef} className="h-full w-full bg-muted/20" />

        {isLoadingMap && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl border border-border bg-background px-4 py-3 flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading map...
            </div>
          </div>
        )}

        {(mapError || !mapsApiKey) && (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl border border-border bg-background/95 px-4 py-3 text-sm text-destructive shadow-lg">
            {mapError ?? "Google Maps API key is not configured."}
          </div>
        )}
      </div>
    </section>
  )
}
