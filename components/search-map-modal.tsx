"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ListFilter, LocateFixed, MapPin, Navigation, Search, Star, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ProviderCardData } from "@/components/provider-card"
import { getCurrentPosition } from "@/lib/location-client"
import {
  loadGoogleMapsApi,
  type GoogleInfoWindowInstance,
  type GoogleMapInstance,
  type GoogleMapsNamespace,
  type GoogleMarkerInstance,
} from "@/lib/google-maps-loader"

type SearchMapModalProps = {
  providers: ProviderCardData[]
}

type SearchMapPanelProps = {
  providers: ProviderCardData[]
  className?: string
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function fallbackCenterFromProviders(providers: ProviderCardData[]): { lat: number; lng: number } {
  const withCoords = providers.filter(
    (provider) => isFiniteNumber(provider.latitude) && isFiniteNumber(provider.longitude),
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

function createProviderPinDataUri() {
  // Custom childcare-themed pin: brand drop pin + tiny school/house glyph.
  const svg = `
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="4" y="8" width="48" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#0b1220" flood-opacity="0.28"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M28 60C28 60 46 42.8 46 30C46 19.5066 37.4934 11 27 11C16.5066 11 8 19.5066 8 30C8 42.8 28 60 28 60Z" fill="#00718d"/>
        <path d="M28 60C28 60 46 42.8 46 30C46 19.5066 37.4934 11 27 11C16.5066 11 8 19.5066 8 30C8 42.8 28 60 28 60Z" stroke="#005466" stroke-width="2"/>
      </g>
      <circle cx="27" cy="30" r="11.5" fill="white"/>
      <path d="M20 31.5V27.8L27 23L34 27.8V31.5C34 32.6 33.1 33.5 32 33.5H22C20.9 33.5 20 32.6 20 31.5Z" fill="#ce1053"/>
      <path d="M23.8 33.5V29.5H27.2V33.5H23.8Z" fill="#00718d"/>
      <rect x="28.6" y="28.7" width="2.2" height="2.2" rx="0.5" fill="#00d4ff"/>
      <path d="M19.2 27.9L27 22.4L34.8 27.9" stroke="#00718d" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
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
        (provider) => isFiniteNumber(provider.latitude) && isFiniteNumber(provider.longitude),
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
                <a href="/providers/${escapeHtml(provider.slug)}" style="font-size:12px;color:#00718d;text-decoration:none;font-weight:600;">View details</a>
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

export function SearchMapModal({ providers }: SearchMapModalProps) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const mapsNamespaceRef = useRef<GoogleMapsNamespace | null>(null)
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null)
  const markerByProviderIdRef = useRef<Map<string, GoogleMarkerInstance>>(new Map())
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [providerQuery, setProviderQuery] = useState("")
  const [isListOpen, setIsListOpen] = useState(false)

  const mapProviders = useMemo(
    () =>
      providers.filter(
        (provider) => isFiniteNumber(provider.latitude) && isFiniteNumber(provider.longitude),
      ),
    [providers],
  )

  const defaultCenter = useMemo(() => fallbackCenterFromProviders(mapProviders), [mapProviders])
  const filteredMapProviders = useMemo(() => {
    const query = providerQuery.trim().toLowerCase()
    if (!query) return mapProviders

    return mapProviders.filter((provider) => {
      const searchable = [
        provider.name,
        provider.location,
        provider.address,
        provider.programTypes.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [mapProviders, providerQuery])

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

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

        mapsNamespaceRef.current = maps
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

        filteredMapProviders.forEach((provider) => {
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
            setSelectedProviderId(providerId)
            infoWindow.setContent(
              `<div style="padding:8px 10px;max-width:220px;">
                <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(provider.name)}</div>
                <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${escapeHtml(locationText)}</div>
                <a href="/providers/${escapeHtml(provider.slug)}" style="font-size:12px;color:#00718d;text-decoration:none;font-weight:600;">View details</a>
              </div>`,
            )
            infoWindow.open({ map, anchor: marker })
          })
        })

        if (filteredMapProviders.length > 1) {
          map.fitBounds(bounds, 80)
        } else if (filteredMapProviders.length === 1) {
          map.setCenter({
            lat: filteredMapProviders[0].latitude,
            lng: filteredMapProviders[0].longitude,
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
  }, [defaultCenter, filteredMapProviders, isOpen, mapsApiKey, userCenter])

  const focusProvider = (providerId: string) => {
    const maps = mapsNamespaceRef.current
    const map = mapRef.current
    const marker = markerByProviderIdRef.current.get(providerId)
    if (!maps || !map || !marker) return

    const position = marker.getPosition()
    if (!position) return
    map.panTo({ lat: position.lat(), lng: position.lng() })
    map.setZoom(13)
    maps.event.trigger(marker, "click")
  }

  return (
    <>
      <Button size="lg" className="shadow-lg" onClick={() => setIsOpen(true)}>
        <MapPin className="h-5 w-5 mr-2" />
        View Map
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="h-[96vh] w-[98vw] max-w-[98vw] rounded-2xl p-0 border-0 overflow-hidden sm:h-[94vh] sm:w-[96vw] sm:max-w-[96vw] xl:h-[92vh] xl:w-[94vw] xl:max-w-[1800px]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Map view</DialogTitle>

          <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950">
            <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />

            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
              <div className="rounded-full bg-background/95 backdrop-blur border border-border px-4 py-2 shadow-lg">
                <p className="text-sm font-semibold text-foreground">Map View</p>
                <p className="text-xs text-muted-foreground">
                  {filteredMapProviders.length} provider{filteredMapProviders.length === 1 ? "" : "s"} shown
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full shadow-md"
                  onClick={() => setIsListOpen((prev) => !prev)}
                >
                  <ListFilter className="h-4 w-4 mr-2" />
                  {isListOpen ? "Hide List" : "Show List"}
                </Button>
                <Button type="button" variant="secondary" className="rounded-full shadow-md" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

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

            <aside
              className={`absolute right-4 top-20 bottom-4 z-20 flex w-[370px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/96 backdrop-blur-md shadow-2xl transition-all duration-300 ${isListOpen ? "translate-x-0 opacity-100" : "translate-x-[108%] opacity-0 pointer-events-none"}`}
            >
              <div className="border-b border-border/70 px-4 py-3 space-y-2.5 bg-background/95">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Providers on map</p>
                  <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {filteredMapProviders.length} results
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Search and tap a card to focus its marker</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={providerQuery}
                    onChange={(event) => setProviderQuery(event.target.value)}
                    placeholder="Search provider, city, or program"
                    className="h-10 pl-9 text-sm rounded-xl border-border/70 bg-background"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 [scrollbar-width:thin]">
                {filteredMapProviders.map((provider) => {
                  const providerId = String(provider.id)
                  const isSelected = selectedProviderId === providerId
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${isSelected ? "border-primary/60 bg-primary/5 shadow-sm" : "border-border/70 bg-background hover:border-primary/35 hover:shadow-sm"}`}
                      onClick={() => focusProvider(providerId)}
                    >
                      <p className="font-semibold text-[15px] text-foreground leading-snug">{provider.name}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <Navigation className="h-3.5 w-3.5" />
                        {provider.location}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        {provider.rating} ({provider.reviewCount})
                      </p>
                      {provider.programTypes.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {provider.programTypes.slice(0, 2).map((program) => (
                            <span
                              key={program}
                              className="rounded-full border border-border/60 bg-muted/25 px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {program}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/providers/${provider.slug}`}
                        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </button>
                  )
                })}
                {filteredMapProviders.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    No providers match that search yet.
                  </div>
                )}
              </div>
            </aside>

            <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-border bg-background/95 p-3 shadow-lg lg:hidden">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LocateFixed className="h-3.5 w-3.5" />
                Tap map pins to preview providers
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
