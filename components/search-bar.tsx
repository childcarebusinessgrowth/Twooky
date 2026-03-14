"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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

interface SearchBarProps {
  variant?: "hero" | "compact"
  surface?: "default" | "overlay"
  className?: string
  defaultProviderType?: string
  searchButtonLabel?: string
}

const PROGRAM_TYPE_OPTIONS = [
  "Infant Care",
  "Toddler Care",
  "Preschool",
  "Pre-K",
  "Montessori",
  "Home Daycare",
  "After School",
]
const AUTO_LOCATION_VALUE_KEY = "eld:auto-location-value"

export function SearchBar({
  variant = "hero",
  surface = "default",
  className = "",
  defaultProviderType,
  searchButtonLabel,
}: SearchBarProps) {
  const router = useRouter()
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [location, setLocation] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [programType, setProgramType] = useState("")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const hasAutoDetectedRef = useRef(false)

  const geolocationHint = useMemo(() => {
    if (mapsApiKey) return null
    return "Google Maps API key is not configured. We can detect coordinates but not city/state."
  }, [mapsApiKey])

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
    
    router.push(`/search?${params.toString()}`)
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
    if (hasAutoDetectedRef.current) return
    if (typeof window === "undefined") return
    hasAutoDetectedRef.current = true

    const cachedLocation = window.sessionStorage.getItem(AUTO_LOCATION_VALUE_KEY)
    if (cachedLocation) {
      setLocation(cachedLocation)
    }

    // Always refresh from live geolocation when visiting / or /search.
    void detectCurrentLocation()
  }, [detectCurrentLocation])

  useEffect(() => {
    if (typeof window === "undefined") return

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
  }, [detectCurrentLocation, isDetectingLocation, location])

  if (variant === "compact") {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location (city or zip)"
            className="pl-10 pr-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
            {PROGRAM_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
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
          <div className="flex-1">
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
              />
              {isDetectingLocation && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
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
              Child Age
            </label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger
                className={`w-full h-11 text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 transition-none ${inputClassName}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Select age" />
                </div>
              </SelectTrigger>
              <SelectContent className="data-[state=open]:animate-none data-[state=closed]:animate-none">
                <SelectItem value="infant">Infant (0-12 mo)</SelectItem>
                <SelectItem value="toddler">Toddler (1-2 yrs)</SelectItem>
                <SelectItem value="preschool">Preschool (3-4 yrs)</SelectItem>
                <SelectItem value="prek">Pre-K (4-5 yrs)</SelectItem>
                <SelectItem value="schoolage">School Age (5+)</SelectItem>
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
                {PROGRAM_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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
