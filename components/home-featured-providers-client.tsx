"use client"

import { useEffect, useRef, useState } from "react"
import type { MarketId } from "@/lib/market"
import { ProviderCard } from "@/components/provider-card"
import {
  getCurrentPosition,
  reverseGeocodeCoordinates,
  writeClientLocationCache,
} from "@/lib/location-client"
import type { ProviderCardDataFromDb } from "@/lib/search-providers-db"

type HomeFeaturedProvidersClientProps = {
  initialProviders: ProviderCardDataFromDb[]
  market: MarketId
}

type FeaturedProvidersApiResponse = { providers?: ProviderCardDataFromDb[] }

async function fetchPersonalizedProviders(params: {
  lat?: number
  lng?: number
  city?: string
  country?: string
}): Promise<ProviderCardDataFromDb[] | null> {
  const query = new URLSearchParams({ limit: "3" })
  if (typeof params.lat === "number") query.set("lat", String(params.lat))
  if (typeof params.lng === "number") query.set("lng", String(params.lng))
  if (params.city) query.set("city", params.city)
  if (params.country) query.set("country", params.country)

  const response = await fetch(`/api/home/featured-providers?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  })
  if (!response.ok) return null
  const payload = (await response.json()) as FeaturedProvidersApiResponse
  if (!Array.isArray(payload.providers)) return null
  return payload.providers
}

export function HomeFeaturedProvidersClient({ initialProviders, market }: HomeFeaturedProvidersClientProps) {
  const [providers, setProviders] = useState(initialProviders)
  const attemptedRef = useRef(false)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (attemptedRef.current) return
    attemptedRef.current = true

    let cancelled = false

    const personalize = async () => {
      try {
        const coordinates = await getCurrentPosition({ timeout: 6000 })
        if (cancelled) return

        let city: string | undefined
        let state: string | undefined
        let countryCode: string | undefined
        let locationText = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`

        if (mapsApiKey) {
          try {
            const geocoded = await reverseGeocodeCoordinates(coordinates, mapsApiKey)
            if (cancelled) return
            city = geocoded.city
            state = geocoded.state
            countryCode = geocoded.countryCode
            locationText = geocoded.locationText
          } catch {
            // Keep coordinate fallback text when reverse geocode fails.
          }
        }

        writeClientLocationCache({
          locationText,
          city,
          state,
          countryCode,
          lat: coordinates.lat,
          lng: coordinates.lng,
        })

        const localized = await fetchPersonalizedProviders({
          lat: coordinates.lat,
          lng: coordinates.lng,
          city,
          country: countryCode,
        }).catch(() => null)
        if (!cancelled && localized && localized.length > 0) {
          setProviders(localized)
        }
      } catch {
        // If permission/lookup fails, retain initial random featured providers.
      }
    }

    void personalize()

    return () => {
      cancelled = true
    }
  }, [mapsApiKey])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.length > 0 ? (
        providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} featured market={market} />
        ))
      ) : (
        <p className="col-span-full rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-10 text-center text-muted-foreground">
          No featured providers available right now.
        </p>
      )}
    </div>
  )
}
