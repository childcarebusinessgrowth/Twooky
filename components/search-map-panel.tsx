"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ProviderCardData } from "@/components/provider-card"
import { getCurrentPosition } from "@/lib/location-client"
import {
  loadGoogleMapsApi,
  type GoogleInfoWindowInstance,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
} from "@/lib/google-maps-loader"
import { createProviderPinDataUri } from "@/lib/map-pin-utils"

type SearchMapPanelProps = {
  providers: ProviderCardData[]
  className?: string
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function hasValidCoordinates(latitude: number | undefined, longitude: number | undefined): boolean {
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return false
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return false
  if (latitude === 0 && longitude === 0) return false
  return true
}

function fallbackCenterFromProviders(providers: ProviderCardData[]): { lat: number; lng: number } {
  const withCoords = providers.filter(
    (provider) => hasValidCoordinates(provider.latitude, provider.longitude),
  )
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function SearchMapPanel({ providers, className = "" }: SearchMapPanelProps) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null)
  const markerByProviderIdRef = useRef<Map<string, GoogleMarkerInstance>>(new Map())
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null)

  const mapProviders = useMemo(
    () =>
      providers.filter(
        (provider) => hasValidCoordinates(provider.latitude, provider.longitude),
      ),
    [providers],
  )

  const defaultCenter = useMemo(() => fallbackCenterFromProviders(mapProviders), [mapProviders])

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

        const center = userCenter ?? defaultCenter
        const map = new maps.Map(mapContainerRef.current, {
          center,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        mapRef.current = map

        const infoWindow = new maps.InfoWindow()
        infoWindowRef.current = infoWindow
        markerByProviderIdRef.current.clear()

        const bounds = new maps.LatLngBounds()

        mapProviders.forEach((provider) => {
          const marker = new maps.Marker({
            map,
            position: {
              lat: provider.latitude,
              lng: provider.longitude,
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
          bounds.extend({ lat: provider.latitude, lng: provider.longitude })

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

        if (mapProviders.length > 1) {
          map.fitBounds(bounds, 80)
        } else if (mapProviders.length === 1) {
          map.setCenter({
            lat: mapProviders[0].latitude,
            lng: mapProviders[0].longitude,
          })
          map.setZoom(13)
        } else {
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
  }, [defaultCenter, mapProviders, mapsApiKey, userCenter])

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
