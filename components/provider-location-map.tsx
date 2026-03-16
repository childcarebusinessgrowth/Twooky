"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { loadGoogleMapsApi } from "@/lib/google-maps-loader"
import { createProviderPinDataUri } from "@/lib/map-pin-utils"

type ProviderLocationMapProps = {
  address: string
  providerName: string
}

export function ProviderLocationMap({ address, providerName }: ProviderLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "no-address" | "geocode-failed" | "map-error">(
    "idle",
  )
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (!address?.trim()) {
      return
    }

    const fetchAndRender = async () => {
      setStatus("loading")
      try {
        const res = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
        if (!res.ok) {
          setStatus("geocode-failed")
          return
        }
        const data = (await res.json()) as { lat: number; lng: number }
        if (typeof data.lat !== "number" || typeof data.lng !== "number") {
          setStatus("geocode-failed")
          return
        }
        setCoords(data)
        setStatus("success")
      } catch {
        setStatus("geocode-failed")
      }
    }

    void fetchAndRender()
  }, [address])

  useEffect(() => {
    if (status !== "success" || !coords || !mapContainerRef.current) return

    let isCancelled = false

    const initializeMap = async () => {
      setIsMapReady(false)
      try {
        const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!mapsApiKey) {
          setStatus("map-error")
          return
        }
        const maps = await loadGoogleMapsApi(mapsApiKey)
        if (isCancelled || !mapContainerRef.current) return

        const map = new maps.Map(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

        const infoWindow = new maps.InfoWindow()
        const escapedName = providerName
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;")
        const escapedAddress = address
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;")

        const marker = new maps.Marker({
          map,
          position: coords,
          title: providerName,
          icon: {
            url: createProviderPinDataUri(),
            scaledSize: new maps.Size(42, 54),
            anchor: new maps.Point(21, 51),
          },
        })

        marker.addListener("click", () => {
          infoWindow.setContent(
            `<div style="padding:8px 10px;max-width:220px;">
              <div style="font-weight:600;margin-bottom:4px;">${escapedName}</div>
              <div style="font-size:12px;color:#6b7280;">${escapedAddress}</div>
            </div>`,
          )
          infoWindow.open({ map, anchor: marker })
        })

        if (!isCancelled) setIsMapReady(true)
      } catch {
        if (!isCancelled) setStatus("map-error")
      }
    }

    void initializeMap()

    return () => {
      isCancelled = true
    }
  }, [status, coords, address, providerName])

  if (!address?.trim()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12">
          <MapPin className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-foreground">Address not available</p>
          <p className="text-sm text-muted-foreground">This provider has not added an address yet.</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "geocode-failed" || status === "map-error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12">
          <MapPin className="h-12 w-12 text-muted-foreground" />
          <p className="font-medium text-foreground">Unable to show map for this address</p>
          <p className="text-sm text-muted-foreground">
            {status === "map-error"
              ? "Google Maps is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
              : "We could not find coordinates for this address."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-[320px] w-full md:h-[360px] lg:h-[400px]">
        <div ref={mapContainerRef} className="h-full w-full bg-muted/20" />

        {(status === "loading" || (status === "success" && !isMapReady)) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl border border-border bg-background px-4 py-3 flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading map...
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
