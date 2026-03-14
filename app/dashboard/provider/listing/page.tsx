"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Save, Trash2, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { PROVIDER_TYPES } from "@/lib/provider-types"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { parseYouTubeUrl } from "@/lib/youtube"
import { deriveProviderSlug } from "@/lib/provider-slug"
import {
  GeolocationError,
  getCurrentPosition,
  getGeolocationErrorMessage,
  reverseGeocodeCoordinates,
} from "@/lib/location-client"

const DEFAULT_ADDRESS = "123 Sunshine Lane, San Francisco, CA 94102"
const AUTO_ADDRESS_SUCCESS_KEY = "eld:auto-address-success"

export default function ManageListingPage() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("Sunshine Daycare Center")
  const [virtualTourUrls, setVirtualTourUrls] = useState<string[]>([""])
  const [virtualTourError, setVirtualTourError] = useState<string | null>(null)
  const [address, setAddress] = useState(DEFAULT_ADDRESS)
  const [isDetectingAddress, setIsDetectingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    let isMounted = true

    async function loadProviderProfile() {
      if (!user) {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
        return
      }

      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("provider_profiles")
          .select("business_name, virtual_tour_url, virtual_tour_urls")
          .eq("profile_id", user.id)
          .maybeSingle()

        if (!isMounted) return
        if (error) {
          setSaveError("Unable to load your listing profile right now.")
          return
        }

        if (data?.business_name) {
          setBusinessName(data.business_name)
        }

        if (data?.virtual_tour_urls && data.virtual_tour_urls.length > 0) {
          setVirtualTourUrls(data.virtual_tour_urls)
        } else if (data?.virtual_tour_url) {
          setVirtualTourUrls([data.virtual_tour_url])
        }
      } catch {
        if (isMounted) {
          setSaveError("Unable to load your listing profile right now.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProviderProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  const handleSave = async () => {
    if (!user) {
      setSaveError("You must be signed in to save listing changes.")
      return
    }

    const trimmedBusinessName = businessName.trim()
    if (!trimmedBusinessName) {
      setSaveError("Business name is required.")
      return
    }

    const enteredUrls = virtualTourUrls.map((url) => url.trim()).filter(Boolean)
    const normalizedVirtualTourUrls: string[] = []

    for (let index = 0; index < enteredUrls.length; index += 1) {
      const parsed = parseYouTubeUrl(enteredUrls[index])
      if (!parsed) {
        setVirtualTourError(
          `Video ${index + 1} has an invalid YouTube link. Please use youtube.com or youtu.be.`,
        )
        return
      }
      if (!normalizedVirtualTourUrls.includes(parsed.normalizedUrl)) {
        normalizedVirtualTourUrls.push(parsed.normalizedUrl)
      }
    }

    setVirtualTourError(null)
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("provider_profiles").upsert(
        {
          profile_id: user.id,
          provider_slug: deriveProviderSlug(trimmedBusinessName),
          business_name: trimmedBusinessName,
          virtual_tour_url: normalizedVirtualTourUrls[0] ?? null,
          virtual_tour_urls: normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : null,
        },
        { onConflict: "profile_id" },
      )

      if (error) {
        setSaveError("Unable to save changes right now. Please try again.")
        return
      }

      setBusinessName(trimmedBusinessName)
      setVirtualTourUrls(normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : [""])
      setSaveSuccess("Saved business name and virtual tours. Additional listing fields are preview-only for now.")
    } catch {
      setSaveError("Unable to save changes right now. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateVirtualTourUrl = (index: number, value: string) => {
    setVirtualTourUrls((prev) => prev.map((item, idx) => (idx === index ? value : item)))
  }

  const addVirtualTourInput = () => {
    setVirtualTourUrls((prev) => [...prev, ""])
  }

  const removeVirtualTourInput = (index: number) => {
    setVirtualTourUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      return next.length > 0 ? next : [""]
    })
  }

  const detectAddressFromCurrentLocation = useCallback(async () => {
    setAddressError(null)
    setIsDetectingAddress(true)
    try {
      const coordinates = await getCurrentPosition()
      if (!mapsApiKey) {
        setAddress(`${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`)
        return
      }

      try {
        const geocoded = await reverseGeocodeCoordinates(coordinates, mapsApiKey)
        setAddress(geocoded.formattedAddress ?? geocoded.locationText)
      } catch {
        setAddress(`${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`)
        setAddressError("Precise address unavailable right now. Using your coordinates instead.")
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(AUTO_ADDRESS_SUCCESS_KEY, "1")
      }
    } catch (error) {
      if (error instanceof GeolocationError) {
        setAddressError(error.message)
      } else if (error instanceof Error) {
        setAddressError(error.message)
      } else {
        setAddressError(getGeolocationErrorMessage("unknown"))
      }
    } finally {
      setIsDetectingAddress(false)
    }
  }, [mapsApiKey])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.sessionStorage.getItem(AUTO_ADDRESS_SUCCESS_KEY) === "1") return
    if (address.trim() && address !== DEFAULT_ADDRESS) return

    void detectAddressFromCurrentLocation()
  }, [address, detectAddressFromCurrentLocation])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Listing</h1>
          <p className="text-muted-foreground">Update your business information and program details</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoadingProfile}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {isLoadingProfile && (
        <p className="text-sm text-muted-foreground">Loading your listing information...</p>
      )}
      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-sm text-green-600">{saveSuccess}</p>
      )}

      {/* Business Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Basic details about your childcare center. Currently, only business name and virtual tour links are persisted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Business Name</FieldLabel>
              <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea 
                rows={4}
                defaultValue="Sunshine Daycare Center provides quality early childhood education in a nurturing environment. Our experienced staff creates engaging learning experiences that help children develop socially, emotionally, and academically."
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input defaultValue="(555) 123-4567" />
              </Field>

              <Field>
                <FieldLabel>Website</FieldLabel>
                <Input defaultValue="www.sunshinedaycare.com" />
              </Field>
            </div>

            <Field>
              <FieldLabel>Address</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="pl-10 pr-10"
                />
                {isDetectingAddress && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {(addressError || !mapsApiKey) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {addressError ??
                    "Google Maps API key is not configured. We can detect coordinates but not city/state."}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Virtual Tours (YouTube URLs)</FieldLabel>
              <div className="space-y-2">
                {virtualTourUrls.map((url, index) => (
                  <div key={`virtual-tour-${index}`} className="flex gap-2">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(event) => updateVirtualTourUrl(index, event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVirtualTourInput(index)}
                      aria-label={`Remove video ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={addVirtualTourInput}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add another video
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Add one or more YouTube links to show as virtual tours on your public provider page.
              </p>
              {virtualTourError && (
                <p className="text-xs text-destructive mt-1">{virtualTourError}</p>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Program Details */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>Information about your programs and services</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Provider Types</FieldLabel>
              <p className="text-xs text-muted-foreground mb-2">
                Select all that apply to your organisation (e.g. nursery, preschool, afterschool program).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {PROVIDER_TYPES.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked={type.id === "nursery" || type.id === "preschool"} />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Separator />

            <Field>
              <FieldLabel>Age Groups Served</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {["Infant (0-12 mo)", "Toddler (1-2 yrs)", "Preschool (3-4 yrs)", "Pre-K (4-5 yrs)", "School Age (5+)"].map((age) => (
                  <label key={age} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked={age !== "School Age (5+)"} />
                    <span className="text-sm">{age}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Curriculum Type</FieldLabel>
                <Select defaultValue="play-based">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="play-based">Play-Based</SelectItem>
                    <SelectItem value="montessori">Montessori</SelectItem>
                    <SelectItem value="reggio">Reggio Emilia</SelectItem>
                    <SelectItem value="waldorf">Waldorf</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Languages Spoken</FieldLabel>
                <Select defaultValue="english-spanish">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="english-spanish">English, Spanish</SelectItem>
                    <SelectItem value="english-mandarin">English, Mandarin</SelectItem>
                    <SelectItem value="multilingual">Multilingual</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Separator />

            <Field>
              <FieldLabel>Amenities & Features</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {["Meals Included", "Outdoor Play Area", "Nap Room", "Security Cameras", "Parent App", "Transportation"].map((feature) => (
                  <label key={feature} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox defaultChecked={feature !== "Transportation"} />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Operating Details */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Operating Details</CardTitle>
          <CardDescription>Hours, pricing, and capacity information</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Opening Time</FieldLabel>
                <Select defaultValue="7:00">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6:00">6:00 AM</SelectItem>
                    <SelectItem value="6:30">6:30 AM</SelectItem>
                    <SelectItem value="7:00">7:00 AM</SelectItem>
                    <SelectItem value="7:30">7:30 AM</SelectItem>
                    <SelectItem value="8:00">8:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Closing Time</FieldLabel>
                <Select defaultValue="18:00">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                    <SelectItem value="17:30">5:30 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                    <SelectItem value="18:30">6:30 PM</SelectItem>
                    <SelectItem value="19:00">7:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Monthly Tuition (From)</FieldLabel>
                <Input type="number" defaultValue="1200" />
              </Field>

              <Field>
                <FieldLabel>Monthly Tuition (To)</FieldLabel>
                <Input type="number" defaultValue="2000" />
              </Field>
            </div>

            <Field>
              <FieldLabel>Total Capacity</FieldLabel>
              <Input type="number" defaultValue="60" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Save button mobile */}
      <div className="sm:hidden">
        <Button onClick={handleSave} disabled={isSaving || isLoadingProfile} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
