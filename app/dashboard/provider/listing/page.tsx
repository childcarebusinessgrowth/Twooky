"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Save, Trash2, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { PROVIDER_TYPES, type ProviderTypeId } from "@/lib/provider-types"
import { AGE_GROUPS, AMENITIES } from "@/lib/listing-options"
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
import { useToast } from "@/hooks/use-toast"

const DEFAULT_ADDRESS = "123 Sunshine Lane, San Francisco, CA 94102"
const AUTO_ADDRESS_SUCCESS_KEY = "eld:auto-address-success"

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export default function ManageListingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [virtualTourUrls, setVirtualTourUrls] = useState<string[]>([""])
  const [virtualTourError, setVirtualTourError] = useState<string | null>(null)
  const [address, setAddress] = useState(DEFAULT_ADDRESS)
  const [isDetectingAddress, setIsDetectingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [providerTypes, setProviderTypes] = useState<ProviderTypeId[]>(["nursery", "preschool"])
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>(["infant", "toddler", "preschool", "prek"])
  const [curriculumType, setCurriculumType] = useState("play-based")
  const [languagesSpoken, setLanguagesSpoken] = useState("english-spanish")
  const [amenities, setAmenities] = useState<string[]>(["meals_included", "outdoor_play_area", "nap_room", "security_cameras", "parent_app"])
  const [openingTime, setOpeningTime] = useState("7:00")
  const [closingTime, setClosingTime] = useState("18:00")
  const [monthlyTuitionFrom, setMonthlyTuitionFrom] = useState<string>("1200")
  const [monthlyTuitionTo, setMonthlyTuitionTo] = useState<string>("2000")
  const [totalCapacity, setTotalCapacity] = useState<string>("60")
  const [listingStatus, setListingStatus] = useState<string>("draft")
  const [photoCount, setPhotoCount] = useState<number>(0)
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  async function fetchPhotoCount(userId: string) {
    const supabase = getSupabaseClient()
    const { count } = await supabase
      .from("provider_photos")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", userId)
    setPhotoCount(count ?? 0)
  }

  useEffect(() => {
    let isMounted = true

    async function loadProviderProfile() {
      if (!user) {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
        return
      }

      const supabase = getSupabaseClient()

      const selectWithStatus =
        "business_name, virtual_tour_url, virtual_tour_urls, description, phone, website, address, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, monthly_tuition_from, monthly_tuition_to, total_capacity, listing_status"
      const selectWithoutStatus =
        "business_name, virtual_tour_url, virtual_tour_urls, description, phone, website, address, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, monthly_tuition_from, monthly_tuition_to, total_capacity"

      try {
        const [profileResult, _] = await Promise.all([
          supabase
            .from("provider_profiles")
            .select(selectWithStatus)
            .eq("profile_id", user.id)
            .maybeSingle(),
          fetchPhotoCount(user.id),
        ])

        let { data, error } = profileResult

        if (error && isMounted) {
          const msg = error.message ?? ""
          const maybeMissingColumn = /column.*does not exist/i.test(msg) || /undefined column/i.test(msg)
          if (maybeMissingColumn) {
            const fallback = await supabase
              .from("provider_profiles")
              .select(selectWithoutStatus)
              .eq("profile_id", user.id)
              .maybeSingle()
            if (!fallback.error && fallback.data) {
              data = fallback.data
              error = null
              setListingStatus("draft")
            }
          }
        }

        if (!isMounted) return

        const metadata = user?.user_metadata as Record<string, unknown> | undefined
        const appMeta = user?.app_metadata as Record<string, unknown> | undefined
        const rawNameFromSignup = metadata?.business_name ?? appMeta?.business_name
        const nameFromSignup =
          typeof rawNameFromSignup === "string" ? rawNameFromSignup.trim() : ""
        const rawPhoneFromSignup = metadata?.phone ?? appMeta?.phone
        const phoneFromSignup =
          typeof rawPhoneFromSignup === "string" ? rawPhoneFromSignup.trim() : ""

        if (data?.listing_status) setListingStatus(data.listing_status)
        if (error) {
          console.error("[Manage Listing] Profile load error:", error.message)
          setSaveError(
            process.env.NODE_ENV === "development" && error.message
              ? `Unable to load listing: ${error.message}`
              : "Unable to load your listing profile right now."
          )
          setBusinessName(nameFromSignup)
          setPhone(phoneFromSignup)
          return
        }

        const nameFromDb = data?.business_name
        setBusinessName(nameFromDb ?? nameFromSignup ?? "")
        setPhone(data?.phone ?? phoneFromSignup ?? "")
        if (data?.description != null) setDescription(data.description)
        if (data?.website != null) setWebsite(data.website)
        if (data?.address != null) setAddress(data.address)
        if (data?.virtual_tour_urls && data.virtual_tour_urls.length > 0) {
          setVirtualTourUrls(data.virtual_tour_urls)
        } else if (data?.virtual_tour_url) {
          setVirtualTourUrls([data.virtual_tour_url])
        }
        if (data?.provider_types && data.provider_types.length > 0) {
          setProviderTypes(data.provider_types as ProviderTypeId[])
        }
        if (data?.age_groups_served && data.age_groups_served.length > 0) {
          setAgeGroupsServed(data.age_groups_served)
        }
        if (data?.curriculum_type != null) setCurriculumType(data.curriculum_type)
        if (data?.languages_spoken != null) setLanguagesSpoken(data.languages_spoken)
        if (data?.amenities && data.amenities.length > 0) setAmenities(data.amenities)
        if (data?.opening_time != null) setOpeningTime(data.opening_time)
        if (data?.closing_time != null) setClosingTime(data.closing_time)
        if (data?.monthly_tuition_from != null) setMonthlyTuitionFrom(String(data.monthly_tuition_from))
        if (data?.monthly_tuition_to != null) setMonthlyTuitionTo(String(data.monthly_tuition_to))
        if (data?.total_capacity != null) setTotalCapacity(String(data.total_capacity))
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unknown error"
          console.error("[Manage Listing] Profile load error:", message)
          setSaveError(
            process.env.NODE_ENV === "development"
              ? `Unable to load listing: ${message}`
              : "Unable to load your listing profile right now."
          )
          const metadata = user?.user_metadata as Record<string, unknown> | undefined
          const appMeta = user?.app_metadata as Record<string, unknown> | undefined
          const rawName = metadata?.business_name ?? appMeta?.business_name
          const rawPhone = metadata?.phone ?? appMeta?.phone
          setBusinessName(typeof rawName === "string" ? rawName.trim() : "")
          setPhone(typeof rawPhone === "string" ? rawPhone.trim() : "")
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

  useEffect(() => {
    if (!user) return
    const onFocus = () => void fetchPhotoCount(user.id)
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [user])

  const isDraftListing = listingStatus === "draft"
  const isPendingListing = listingStatus === "pending"
  const primaryActionLabel = isDraftListing ? "Submit" : "Save Changes"

  function validateDraftSubmission(
    values: {
      businessName: string
      description: string
      phone: string
      website: string
      address: string
      providerTypes: ProviderTypeId[]
      ageGroupsServed: string[]
      curriculumType: string
      languagesSpoken: string
      amenities: string[]
      openingTime: string
      closingTime: string
      tuitionFrom: number | null
      tuitionTo: number | null
      capacity: number | null
      photoCount: number
    },
  ): string | null {
    const missing: string[] = []
    if (!values.businessName.trim()) missing.push("Business Name")
    if (!values.description.trim()) missing.push("Description")
    if (!values.phone.trim()) missing.push("Phone Number")
    if (!values.website.trim()) missing.push("Website")
    if (!values.address.trim()) missing.push("Address")
    if (values.providerTypes.length === 0) missing.push("Provider Types")
    if (values.ageGroupsServed.length === 0) missing.push("Age Groups Served")
    if (!values.curriculumType.trim()) missing.push("Curriculum Type")
    if (!values.languagesSpoken.trim()) missing.push("Languages Spoken")
    if (values.amenities.length === 0) missing.push("Amenities & Features")
    if (!values.openingTime.trim()) missing.push("Opening Time")
    if (!values.closingTime.trim()) missing.push("Closing Time")
    if (values.tuitionFrom == null) missing.push("Monthly Tuition (From)")
    if (values.tuitionTo == null) missing.push("Monthly Tuition (To)")
    if (values.capacity == null) missing.push("Total Capacity")
    if (values.photoCount < 1) missing.push("At least one uploaded photo")
    if (missing.length === 0) return null
    return `Before submitting, please complete: ${missing.join(", ")}.`
  }

  const handleSave = async () => {
    if (!user) {
      setSaveError("You must be signed in to save listing changes.")
      return
    }
    if (isPendingListing) {
      setSaveError("Your profile is under review. Editing is locked until admin approval.")
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

    const tuitionFrom = parseOptionalInteger(monthlyTuitionFrom)
    const tuitionTo = parseOptionalInteger(monthlyTuitionTo)
    const capacity = parseOptionalInteger(totalCapacity)

    if (isDraftListing) {
      const validationError = validateDraftSubmission({
        businessName: trimmedBusinessName,
        description,
        phone,
        website,
        address,
        providerTypes,
        ageGroupsServed,
        curriculumType,
        languagesSpoken,
        amenities,
        openingTime,
        closingTime,
        tuitionFrom,
        tuitionTo,
        capacity,
        photoCount,
      })
      if (validationError) {
        setSaveError(validationError)
        setIsSaving(false)
        return
      }
    }

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("provider_profiles").upsert(
        {
          profile_id: user.id,
          ...(isDraftListing ? { listing_status: "pending" } : {}),
          provider_slug: deriveProviderSlug(trimmedBusinessName),
          business_name: trimmedBusinessName,
          virtual_tour_url: normalizedVirtualTourUrls[0] ?? null,
          virtual_tour_urls: normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : null,
          description: description.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          address: address.trim() || null,
          provider_types: providerTypes.length > 0 ? providerTypes : null,
          age_groups_served: ageGroupsServed.length > 0 ? ageGroupsServed : null,
          curriculum_type: curriculumType || null,
          languages_spoken: languagesSpoken || null,
          amenities: amenities.length > 0 ? amenities : null,
          opening_time: openingTime || null,
          closing_time: closingTime || null,
          monthly_tuition_from: tuitionFrom ?? null,
          monthly_tuition_to: tuitionTo ?? null,
          total_capacity: capacity ?? null,
        },
        { onConflict: "profile_id" },
      )

      if (error) {
        console.error("[Manage Listing] Save error:", error.message)
        setSaveError(
          process.env.NODE_ENV === "development" && error.message
            ? `Save failed: ${error.message}`
            : "Unable to save changes right now. Please try again."
        )
        return
      }

      setBusinessName(trimmedBusinessName)
      setVirtualTourUrls(normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : [""])
      if (isDraftListing) {
        setListingStatus("pending")
      }
      let successMessage = isDraftListing
        ? "Thank you. Your profile has been submitted and is now under admin review."
        : "All listing details have been saved."
      if (photoCount === 0)
        successMessage += " Consider adding photos in the Photos section to improve your listing."
      setSaveSuccess(successMessage)
      toast({
        title: isDraftListing ? "Submitted" : "Listing saved",
        description: successMessage,
        variant: "success",
      })
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
          <p className="text-muted-foreground">
            {isDraftListing
              ? "Complete your profile and submit for admin approval."
              : isPendingListing
                ? "Your submission is under review. Editing is locked until approval."
                : "Update your business information and program details"}
          </p>
        </div>
        {!isPendingListing && (
          <Button onClick={handleSave} disabled={isSaving || isLoadingProfile}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? (isDraftListing ? "Submitting..." : "Saving...") : primaryActionLabel}
          </Button>
        )}
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

      {isDraftListing && !saveError && !saveSuccess && !isLoadingProfile && (
        <p className="text-sm text-muted-foreground">
          Fill in all profile details, add at least one photo, then click <strong>Submit</strong>. Video URL is optional.
        </p>
      )}

      {isPendingListing && !saveSuccess && !saveError && !isLoadingProfile && (
        <p className="text-sm text-muted-foreground">
          Thank you. Your listing is under review. We&apos;ll notify you when it&apos;s live on the directory.
        </p>
      )}

      {!isLoadingProfile && photoCount === 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              Add at least one photo so families can see your space. Go to{" "}
              <Link href="/dashboard/provider/photos" className="font-medium text-primary underline underline-offset-2">
                Photos
              </Link>{" "}
              to upload.
            </p>
          </CardContent>
        </Card>
      )}

      <fieldset disabled={isPendingListing || isSaving || isLoadingProfile} className="space-y-6">
      {/* Business Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Basic details about your childcare center.
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>

              <Field>
                <FieldLabel>Website</FieldLabel>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
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
                    <Checkbox
                      checked={providerTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        setProviderTypes((prev) =>
                          checked ? [...prev, type.id] : prev.filter((id) => id !== type.id),
                        )
                      }}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Separator />

            <Field>
              <FieldLabel>Age Groups Served</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {AGE_GROUPS.map((age) => (
                  <label key={age.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={ageGroupsServed.includes(age.id)}
                      onCheckedChange={(checked) => {
                        setAgeGroupsServed((prev) =>
                          checked ? [...prev, age.id] : prev.filter((id) => id !== age.id),
                        )
                      }}
                    />
                    <span className="text-sm">{age.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Curriculum Type</FieldLabel>
                <Select value={curriculumType} onValueChange={setCurriculumType}>
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
                <Select value={languagesSpoken} onValueChange={setLanguagesSpoken}>
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
                {AMENITIES.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={amenities.includes(a.id)}
                      onCheckedChange={(checked) => {
                        setAmenities((prev) =>
                          checked ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                        )
                      }}
                    />
                    <span className="text-sm">{a.label}</span>
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
                <Select value={openingTime} onValueChange={setOpeningTime}>
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
                <Select value={closingTime} onValueChange={setClosingTime}>
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
                <Input
                  type="number"
                  value={monthlyTuitionFrom}
                  onChange={(e) => setMonthlyTuitionFrom(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Monthly Tuition (To)</FieldLabel>
                <Input
                  type="number"
                  value={monthlyTuitionTo}
                  onChange={(e) => setMonthlyTuitionTo(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Total Capacity</FieldLabel>
              <Input
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      </fieldset>

      {/* Save button mobile */}
      {!isPendingListing && (
        <div className="sm:hidden">
          <Button onClick={handleSave} disabled={isSaving || isLoadingProfile} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? (isDraftListing ? "Submitting..." : "Saving...") : primaryActionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
