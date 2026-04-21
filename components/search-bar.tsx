"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, User, Layers, Loader2, LocateFixed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLIENT_LOCATION_UPDATED_EVENT,
  GeolocationError,
  getCurrentPosition,
  getGeolocationErrorMessage,
  readClientLocationCache,
  reverseGeocodeCoordinates,
  writeClientLocationCache,
} from "@/lib/location-client"

export interface SearchBarProps {
  variant?: "hero" | "compact"
  surface?: "default" | "overlay"
  className?: string
  defaultProviderType?: string
  searchButtonLabel?: string
  targetPath?: string
  /** Overrides default hero location hint when not using coordinate fallback */
  heroLocationPlaceholder?: string
  /** Overrides default compact location hint when not using coordinate fallback */
  compactLocationPlaceholder?: string
}

function normalizeCountryCode(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  const upper = trimmed.toUpperCase()
  if (upper === "UK") return "GB"
  return upper
}

function countryCodeToLabel(raw: string): string {
  const code = normalizeCountryCode(raw)
  if (!code) return ""
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") return ""

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" })
    return displayNames.of(code) ?? ""
  } catch {
    return ""
  }
}

function isCoordinateLocationText(value: string): boolean {
  return /^-?\d{1,3}(?:\.\d+)?,\s*-?\d{1,3}(?:\.\d+)?$/.test(value.trim())
}

type LocationSuggestion = {
  placeId: string
  description: string
  mainText: string
  secondaryText?: string
}

export function SearchBar({
  ...props
}: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarFallback className={props.className} />}>
      <SearchBarContent {...props} />
    </Suspense>
  )
}

export function SearchBarFallback({ className = "" }: Pick<SearchBarProps, "className">) {
  return (
    <div className={`rounded-3xl border p-5 md:p-6 bg-card border-border shadow-lg ${className}`}>
      <div className="h-12 rounded-full bg-muted/60" />
    </div>
  )
}

function SearchBarContent({
  variant = "hero",
  surface = "default",
  className = "",
  defaultProviderType,
  searchButtonLabel,
  targetPath = "/search",
  heroLocationPlaceholder: heroPlaceholderProp,
  compactLocationPlaceholder: compactPlaceholderProp,
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [location, setLocation] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [programType, setProgramType] = useState("")
  const [ageGroupOptions, setAgeGroupOptions] = useState<Array<{ value: string; label: string }>>([])
  const [programTypeOptions, setProgramTypeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLocationSuggestionsLoading, setIsLocationSuggestionsLoading] = useState(false)
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [activeLocationSuggestionIndex, setActiveLocationSuggestionIndex] = useState(-1)
  const hasAutoDetectedRef = useRef(false)
  const locationSuggestionRequestIdRef = useRef(0)

  const geolocationHint = useMemo(() => {
    if (mapsApiKey) return null
    return "Google Maps API key is not configured. We can detect coordinates but not city/state."
  }, [mapsApiKey])

  const locationFromUrl = useMemo(() => {
    const directLocation = searchParams.get("location")?.trim()
    if (directLocation) return directLocation

    const city = searchParams.get("city")?.trim()
    const country = searchParams.get("country")?.trim()
    if (city && country) return `${city.replace(/-/g, " ")}, ${country.toUpperCase()}`
    if (city) return city.replace(/-/g, " ")
    if (country) {
      return countryCodeToLabel(country)
    }
    return ""
  }, [searchParams])
  const showsCoordinateFallback = useMemo(() => isCoordinateLocationText(location), [location])
  const locationInputValue = showsCoordinateFallback ? "" : location
  const compactLocationPlaceholder = showsCoordinateFallback
    ? "Using current location"
    : (compactPlaceholderProp ?? "Location (city or zip)")
  const heroLocationPlaceholder = showsCoordinateFallback
    ? "Using current location"
    : (heroPlaceholderProp ?? "City, state, or zip")
  const hasLocationQuery = useMemo(() => {
    const directLocation = searchParams.get("location")?.trim()
    if (directLocation) return true
    const city = searchParams.get("city")?.trim()
    if (city) return true
    const country = searchParams.get("country")?.trim()
    return Boolean(country)
  }, [searchParams])
  const isOnTargetPath = pathname === targetPath

  useEffect(() => {
    const query = location.trim()

    if (!query || query.length < 2) {
      locationSuggestionRequestIdRef.current += 1
      setLocationSuggestions([])
      setActiveLocationSuggestionIndex(-1)
      setIsLocationSuggestionsLoading(false)
      return
    }

    const requestId = ++locationSuggestionRequestIdRef.current
    setLocationSuggestions([])
    setActiveLocationSuggestionIndex(-1)
    setIsLocationSuggestionsLoading(true)
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/locations/autocomplete?input=${encodeURIComponent(query)}`, {
            cache: "no-store",
          })
          const data = (await response.json().catch(() => ({}))) as {
            suggestions?: LocationSuggestion[]
          }

          if (requestId !== locationSuggestionRequestIdRef.current) return

          if (!response.ok) {
            setLocationSuggestions([])
            setActiveLocationSuggestionIndex(-1)
            return
          }

          const nextSuggestions = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 8) : []
          setLocationSuggestions(nextSuggestions)
          setActiveLocationSuggestionIndex(-1)
        } catch {
          if (requestId !== locationSuggestionRequestIdRef.current) return
          setLocationSuggestions([])
          setActiveLocationSuggestionIndex(-1)
        } finally {
          if (requestId === locationSuggestionRequestIdRef.current) {
            setIsLocationSuggestionsLoading(false)
          }
        }
      })()
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [location])

  const handleSearch = (locationOverride?: string) => {
    const params = new URLSearchParams()
    const normalizedLocation = (locationOverride ?? location).trim()
    if (normalizedLocation) params.set("location", normalizedLocation)
    if (ageGroup) params.set("age", ageGroup)
    if (defaultProviderType && defaultProviderType !== "all") {
      params.set("providerType", defaultProviderType)
    }
    if (programType && programType !== "all") {
      params.set("programTypes", programType)
    }

    const query = params.toString()
    router.push(query ? `${targetPath}?${query}` : targetPath)
  }

  const applyLocationSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.description)
    setLocationSuggestions([])
    setActiveLocationSuggestionIndex(-1)
    setIsLocationFocused(false)
    handleSearch(suggestion.description)
  }

  const locationQuery = location.trim()
  const showLocationSuggestions =
    isLocationFocused &&
    locationQuery.length >= 2 &&
    (isLocationSuggestionsLoading || locationSuggestions.length > 0)
  const showNoLocationSuggestions =
    isLocationFocused &&
    locationQuery.length >= 2 &&
    !isLocationSuggestionsLoading &&
    locationSuggestions.length === 0

  const locationSuggestionsDropdown = showLocationSuggestions || showNoLocationSuggestions ? (
    <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-xl">
      {isLocationSuggestionsLoading ? (
        <div className="px-4 py-3 text-sm text-muted-foreground">Searching locations...</div>
      ) : locationSuggestions.length > 0 ? (
        <div className="max-h-72 overflow-auto py-2">
          {locationSuggestions.map((suggestion, index) => {
            const isActive = index === activeLocationSuggestionIndex
            return (
              <button
                key={suggestion.placeId}
                type="button"
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                }`}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onMouseEnter={() => setActiveLocationSuggestionIndex(index)}
                onClick={() => applyLocationSuggestion(suggestion)}
              >
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isActive ? "text-accent-foreground" : "text-muted-foreground"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{suggestion.mainText}</span>
                  {suggestion.secondaryText && (
                    <span
                      className={`block truncate text-xs ${
                        isActive ? "text-accent-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {suggestion.secondaryText}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-muted-foreground">No matching locations found.</div>
      )}
    </div>
  ) : null

  const handleLocationKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && locationSuggestions.length > 0) {
      event.preventDefault()
      setIsLocationFocused(true)
      setActiveLocationSuggestionIndex((current) => (current < locationSuggestions.length - 1 ? current + 1 : 0))
      return
    }

    if (event.key === "ArrowUp" && locationSuggestions.length > 0) {
      event.preventDefault()
      setIsLocationFocused(true)
      setActiveLocationSuggestionIndex((current) =>
        current <= 0 ? locationSuggestions.length - 1 : current - 1,
      )
      return
    }

    if (event.key === "Escape") {
      setIsLocationFocused(false)
      setActiveLocationSuggestionIndex(-1)
      setLocationSuggestions([])
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      if (activeLocationSuggestionIndex >= 0 && activeLocationSuggestionIndex < locationSuggestions.length) {
        applyLocationSuggestion(locationSuggestions[activeLocationSuggestionIndex])
        return
      }
      handleSearch()
    }
  }

  const handleLocationBlur = () => {
    window.setTimeout(() => {
      setIsLocationFocused(false)
      setActiveLocationSuggestionIndex(-1)
    }, 120)
  }

  const detectCurrentLocation = useCallback(async () => {
    setLocationError(null)
    setIsDetectingLocation(true)
    try {
      const coordinates = await getCurrentPosition()
      if (!mapsApiKey) {
        const fallbackValue = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
        setLocation(fallbackValue)
        writeClientLocationCache({
          locationText: fallbackValue,
          lat: coordinates.lat,
          lng: coordinates.lng,
        })
        return
      }

      try {
        const geocoded = await reverseGeocodeCoordinates(coordinates, mapsApiKey)
        const resolvedLocation = geocoded.locationText
        setLocation(resolvedLocation)
        writeClientLocationCache({
          locationText: resolvedLocation,
          city: geocoded.city,
          state: geocoded.state,
          countryCode: geocoded.countryCode,
          lat: coordinates.lat,
          lng: coordinates.lng,
        })
      } catch {
        // Keep UX useful even if geocoding fails or API quota is hit.
        const fallbackValue = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
        setLocation(fallbackValue)
        setLocationError("Precise city name unavailable right now. Using your coordinates instead.")
        writeClientLocationCache({
          locationText: fallbackValue,
          lat: coordinates.lat,
          lng: coordinates.lng,
        })
      }
    } catch (error) {
      if (error instanceof GeolocationError) {
        setLocationError(null)
        return
      }
      if (error instanceof Error) {
        setLocationError(error.message)
      } else {
        setLocationError(getGeolocationErrorMessage("unknown"))
      }
    } finally {
      setIsDetectingLocation(false)
    }
  }, [mapsApiKey])

  useEffect(() => {
    if (!isOnTargetPath) return
    if (!searchParams) return

    if (locationFromUrl) setLocation(locationFromUrl)

    const ageFromUrl = searchParams.get("age")?.trim() ?? ""
    setAgeGroup(ageFromUrl)

    const firstProgramType = (searchParams.get("programTypes") ?? "")
      .split(",")
      .map((item) => item.trim())
      .find(Boolean)
    setProgramType(firstProgramType ?? "")
  }, [isOnTargetPath, locationFromUrl, searchParams])

  useEffect(() => {
    let cancelled = false

    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const res = await fetch("/api/search/options", { method: "GET" })
        if (!res.ok) return
        const json = (await res.json()) as {
          ageGroups?: Array<{ value: string; label: string }>
          programTypes?: Array<{ value: string; label: string }>
        }
        if (cancelled) return
        setAgeGroupOptions(Array.isArray(json.ageGroups) ? json.ageGroups : [])
        setProgramTypeOptions(Array.isArray(json.programTypes) ? json.programTypes : [])
      } catch {
        // ignore; keep UI usable even if options load fails
      } finally {
        if (!cancelled) setIsLoadingOptions(false)
      }
    }

    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (hasAutoDetectedRef.current) return
    if (typeof window === "undefined") return
    if (isOnTargetPath && hasLocationQuery) return
    hasAutoDetectedRef.current = true

    const cached = readClientLocationCache()
    if (cached?.locationText) {
      setLocation(cached.locationText)
    }
  }, [hasLocationQuery, isOnTargetPath])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isOnTargetPath && hasLocationQuery) return

    const syncFromCache = () => {
      const cached = readClientLocationCache()
      if (cached?.locationText) {
        setLocation(cached.locationText)
      }
    }

    window.addEventListener(CLIENT_LOCATION_UPDATED_EVENT, syncFromCache)
    return () => {
      window.removeEventListener(CLIENT_LOCATION_UPDATED_EVENT, syncFromCache)
    }
  }, [hasLocationQuery, isOnTargetPath])

  if (variant === "compact") {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <div className="relative flex-1 min-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={compactLocationPlaceholder}
            className="pl-10 pr-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none"
            value={locationInputValue}
            onChange={(e) => {
              setLocation(e.target.value)
              setActiveLocationSuggestionIndex(-1)
            }}
            onFocus={() => setIsLocationFocused(true)}
            onBlur={handleLocationBlur}
            onKeyDown={handleLocationKeyDown}
          />
          <button
            type="button"
            onClick={() => void detectCurrentLocation()}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Use my current location"
            title="Use my current location"
          >
            {isDetectingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </button>
          {locationSuggestionsDropdown}
        </div>
        <Select value={programType} onValueChange={setProgramType}>
          <SelectTrigger className="sm:w-48 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none">
            <SelectValue placeholder="Program Type" />
          </SelectTrigger>
          <SelectContent className="data-[state=open]:animate-none data-[state=closed]:animate-none">
            <SelectItem value="all">All Programs</SelectItem>
            {programTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => handleSearch()}
          className="bg-primary hover:bg-primary/90 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none"
        >
          <Search className="h-4 w-4" />
          <span className="ml-2">{searchButtonLabel ?? "Search"}</span>
        </Button>
        {(locationError || geolocationHint) && (
          <p className="sm:basis-full text-xs text-muted-foreground">
            {locationError ?? geolocationHint}
          </p>
        )}
      </div>
    )
  }

  const surfaceStyles =
    surface === "overlay"
      ? "bg-white/94 supports-[backdrop-filter]:bg-white/84 backdrop-blur-lg border-white/65 shadow-[0_18px_45px_rgba(0,0,0,0.24)]"
      : "bg-card border-border shadow-lg"
  const isOverlay = surface === "overlay"
  const labelClassName = isOverlay ? "text-foreground/80" : "text-muted-foreground"
  const inputClassName = isOverlay
    ? "bg-white/92 border-border/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
    : ""
  const ctaClassName = isOverlay
    ? "shadow-[0_10px_20px_rgba(0,113,141,0.35)]"
    : ""

  return (
    <div className={`rounded-3xl border p-5 md:p-6 ${surfaceStyles} ${className}`}>
      <div className="flex flex-col gap-4 md:gap-5">
        {/* Fields row */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Location */}
          <div className="flex-1 min-w-[200px]">
            <label className={`text-xs font-medium mb-2 block ${labelClassName}`}>
              Location
            </label>
            <div className="relative w-full">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={heroLocationPlaceholder}
                className={`w-full pl-10 pr-4 h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
                value={locationInputValue}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setActiveLocationSuggestionIndex(-1)
                }}
                onFocus={() => setIsLocationFocused(true)}
                onBlur={handleLocationBlur}
                onKeyDown={handleLocationKeyDown}
              />
              {locationSuggestionsDropdown}
            </div>
            {(locationError || geolocationHint) && (
              <p className="text-xs text-muted-foreground mt-1">
                {locationError ?? geolocationHint}
              </p>
            )}
          </div>

          {/* Child Age */}
          <div className="flex-1">
            <label className={`text-xs font-medium mb-2 block ${labelClassName}`}>
              Child Age Range
            </label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger
                className={`w-full h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select age range"} />
                </div>
              </SelectTrigger>
              <SelectContent className="data-[state=open]:animate-none data-[state=closed]:animate-none">
                {ageGroupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Program Type */}
          <div className="flex-1">
            <label className={`text-xs font-medium mb-2 block ${labelClassName}`}>
              Program Type
            </label>
            <Select value={programType} onValueChange={setProgramType}>
              <SelectTrigger
                className={`w-full h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All programs" />
                </div>
              </SelectTrigger>
              <SelectContent className="data-[state=open]:animate-none data-[state=closed]:animate-none">
                <SelectItem value="all">All Programs</SelectItem>
                {programTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button - Full width */}
        <Button
          onClick={() => handleSearch()}
          size="lg"
          className={`w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${ctaClassName}`}
        >
          <Search className="h-5 w-5 mr-2" />
          {searchButtonLabel ?? "Search Providers"}
        </Button>
      </div>
    </div>
  )
}
