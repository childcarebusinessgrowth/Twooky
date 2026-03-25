"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, User, Layers, Loader2 } from "lucide-react"
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
  GeolocationError,
  getCurrentPosition,
  getGeolocationErrorMessage,
  reverseGeocodeCoordinates,
} from "@/lib/location-client"

export interface SearchBarProps {
  variant?: "hero" | "compact"
  surface?: "default" | "overlay"
  className?: string
  defaultProviderType?: string
  searchButtonLabel?: string
  targetPath?: string
}

const AUTO_LOCATION_VALUE_KEY = "eld:auto-location-value"

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
  const hasAutoDetectedRef = useRef(false)

  const geolocationHint = useMemo(() => {
    if (mapsApiKey) return null
    return "Google Maps API key is not configured. We can detect coordinates but not city/state."
  }, [mapsApiKey])

  const displayError = useMemo(() => {
    if (!locationError) return null
    const deniedMsg = getGeolocationErrorMessage("permission-denied")
    const lower = locationError.toLowerCase()
    if (locationError === deniedMsg || (lower.includes("permission") && lower.includes("denied"))) return null
    return locationError
  }, [locationError])

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
  const hasLocationQuery = useMemo(() => {
    const directLocation = searchParams.get("location")?.trim()
    if (directLocation) return true
    const city = searchParams.get("city")?.trim()
    if (city) return true
    const country = searchParams.get("country")?.trim()
    return Boolean(country)
  }, [searchParams])
  const isOnTargetPath = pathname === targetPath

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set("location", location)
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

  const detectCurrentLocation = useCallback(async () => {
    setLocationError(null)
    setIsDetectingLocation(true)
    try {
      const coordinates = await getCurrentPosition()
      if (!mapsApiKey) {
        const fallbackValue = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
        setLocation(fallbackValue)
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(AUTO_LOCATION_VALUE_KEY, fallbackValue)
        }
        return
      }

      try {
        const geocoded = await reverseGeocodeCoordinates(coordinates, mapsApiKey)
        const resolvedLocation = geocoded.locationText
        setLocation(resolvedLocation)
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(AUTO_LOCATION_VALUE_KEY, resolvedLocation)
        }
      } catch {
        // Keep UX useful even if geocoding fails or API quota is hit.
        const fallbackValue = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
        setLocation(fallbackValue)
        setLocationError("Precise city name unavailable right now. Using your coordinates instead.")
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(AUTO_LOCATION_VALUE_KEY, fallbackValue)
        }
      }
    } catch (error) {
      if (error instanceof GeolocationError && error.code === "permission-denied") {
        setLocationError(null)
        return
      }
      if (error instanceof GeolocationError) {
        setLocationError(error.message)
      } else if (error instanceof Error) {
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

    const cachedLocation = window.sessionStorage.getItem(AUTO_LOCATION_VALUE_KEY)
    if (cachedLocation) {
      setLocation(cachedLocation)
    }

    // Always refresh from live geolocation when visiting / or /search.
    void detectCurrentLocation()
  }, [detectCurrentLocation, hasLocationQuery, isOnTargetPath])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isOnTargetPath && hasLocationQuery) return

    const retryIfEmpty = () => {
      if (!location.trim() && !isDetectingLocation) {
        const cachedLocation = window.sessionStorage.getItem(AUTO_LOCATION_VALUE_KEY)
        if (cachedLocation) {
          setLocation(cachedLocation)
          return
        }
        void detectCurrentLocation()
      }
    }

    window.addEventListener("focus", retryIfEmpty)
    document.addEventListener("visibilitychange", retryIfEmpty)
    return () => {
      window.removeEventListener("focus", retryIfEmpty)
      document.removeEventListener("visibilitychange", retryIfEmpty)
    }
  }, [detectCurrentLocation, hasLocationQuery, isDetectingLocation, isOnTargetPath, location])

  if (variant === "compact") {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <div className="relative flex-1 min-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location (city or zip)"
            className="pl-10 pr-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
          {isDetectingLocation && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
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
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none"
        >
          <Search className="h-4 w-4" />
          <span className="ml-2">{searchButtonLabel ?? "Search"}</span>
        </Button>
        {(displayError || geolocationHint) && (
          <p className="sm:basis-full text-xs text-muted-foreground">
            {displayError ?? geolocationHint}
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
                placeholder="City, state, or zip"
                className={`w-full pl-10 pr-10 h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              {isDetectingLocation && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {(displayError || geolocationHint) && (
              <p className="text-xs text-muted-foreground mt-1">
                {displayError ?? geolocationHint}
              </p>
            )}
          </div>

          {/* Child Age */}
          <div className="flex-1">
            <label className={`text-xs font-medium mb-2 block ${labelClassName}`}>
              Child Age
            </label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger
                className={`w-full h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select age"} />
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
          onClick={handleSearch}
          size="lg"
          className={`w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${ctaClassName}`}
        >
          <Search className="h-5 w-5 mr-2" />
          {searchButtonLabel ?? "Search Childcare"}
        </Button>
      </div>
    </div>
  )
}
