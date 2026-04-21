"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Plus, Save, Trash2, Loader2, MapPin, Building2, GraduationCap, Clock, CheckCircle, AlertCircle, Info, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { PROVIDER_TYPES, type ProviderTypeId } from "@/lib/provider-types"
import { AMENITIES, CURRICULUM_OPTIONS } from "@/lib/listing-options"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { parseYouTubeUrl } from "@/lib/youtube"
import {
  GeolocationError,
  getCurrentPosition,
  getGeolocationErrorMessage,
  reverseGeocodeCoordinates,
} from "@/lib/location-client"
import { useToast } from "@/hooks/use-toast"
import { Suspense } from "react"
import { ProfileTour } from "@/components/provider/ProfileTour"
import { PostSubmitPhotosTour } from "@/components/provider/PostSubmitPhotosTour"
import {
  PROVIDER_DOCUMENTS_BUCKET,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/provider-documents-constants"
import { getProviderPlanAccess, type ProviderPlanAccess } from "@/lib/provider-plan-access"
import { normalizeProviderWebsiteUrl } from "@/lib/normalize-provider-website-url"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

const DOCUMENT_TYPES = ["Business License", "ID Verification", "Utility Bill", "Other"] as const

const DEFAULT_ADDRESS = "123 Sunshine Lane, San Francisco, CA 94102"
const AUTO_ADDRESS_SUCCESS_KEY = "eld:auto-address-success"
const LISTING_DRAFT_STORAGE_KEY = "eld:provider-listing-draft"

type ListingDraftSnapshot = {
  businessName: string
  virtualTourUrls: string[]
  address: string
  description: string
  phone: string
  email: string
  website: string
  providerTypes: ProviderTypeId[]
  programTypeIds: string[]
  ageGroupsServed: string[]
  curriculumTypes: string[]
  languagesSpoken: string
  amenities: string[]
  openingTime: string
  closingTime: string
  dailyFeeFrom: string
  dailyFeeTo: string
  registrationFee: string
  depositFee: string
  mealsFee: string
  serviceTransport: boolean
  serviceExtendedHours: boolean
  servicePickupDropoff: boolean
  serviceExtracurriculars: boolean
  currencyId: string
  totalCapacity: string
  listingStatus: string
}

type AgeGroupOption = {
  id: string
  label: string
}

type ProgramTypeOption = {
  id: string
  label: string
  slug: string | null
}

function saveDraftToStorage(snapshot: ListingDraftSnapshot) {
  try {
    window.sessionStorage.setItem(LISTING_DRAFT_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

function loadDraftFromStorage(): ListingDraftSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(LISTING_DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ListingDraftSnapshot
  } catch {
    return null
  }
}

function clearDraftFromStorage() {
  try {
    window.sessionStorage.removeItem(LISTING_DRAFT_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeAgeGroupTag(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized === "schoolage" || normalized === "school age" || normalized === "school") {
    return "school_age"
  }
  return normalized
}

async function resolveGooglePlaceId(
  businessName: string,
  address: string,
): Promise<string | null> {
  const response = await fetch("/api/provider/resolve-place-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName, address }),
  }).catch(() => null)

  if (!response || !response.ok) return null
  const payload = (await response.json().catch(() => null)) as
    | { placeId?: string | null }
    | null
  const placeId = payload?.placeId?.trim()
  return placeId || null
}

async function enrichGoogleCacheAfterSave(
  businessName: string,
  address: string,
  placeId: string | null,
): Promise<void> {
  await fetch("/api/provider/enrich-google-cache", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName, address, placeId }),
  }).catch(() => null)
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
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [providerTypes, setProviderTypes] = useState<ProviderTypeId[]>(["nursery", "preschool"])
  const [selectedProgramTypeIds, setSelectedProgramTypeIds] = useState<string[]>([])
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>([])
  const [availableAgeGroups, setAvailableAgeGroups] = useState<AgeGroupOption[]>([])
  const [availableProgramTypes, setAvailableProgramTypes] = useState<ProgramTypeOption[]>([])
  const [curriculumTypes, setCurriculumTypes] = useState<string[]>(["play-based"])
  const [languagesSpoken, setLanguagesSpoken] = useState("english-spanish")
  const [amenities, setAmenities] = useState<string[]>(["meals_included", "outdoor_play_area", "nap_room", "security_cameras", "parent_app"])
  const [openingTime, setOpeningTime] = useState("7:00")
  const [closingTime, setClosingTime] = useState("18:00")
  const [dailyFeeFrom, setDailyFeeFrom] = useState<string>("")
  const [dailyFeeTo, setDailyFeeTo] = useState<string>("")
  const [registrationFee, setRegistrationFee] = useState<string>("")
  const [depositFee, setDepositFee] = useState<string>("")
  const [mealsFee, setMealsFee] = useState<string>("")
  const [serviceTransport, setServiceTransport] = useState(false)
  const [serviceExtendedHours, setServiceExtendedHours] = useState(false)
  const [servicePickupDropoff, setServicePickupDropoff] = useState(false)
  const [serviceExtracurriculars, setServiceExtracurriculars] = useState(false)
  const [currencyId, setCurrencyId] = useState<string>("")
  const [currencies, setCurrencies] = useState<Array<{ id: string; code: string; name: string; symbol: string }>>([])
  const [totalCapacity, setTotalCapacity] = useState<string>("60")
  const [listingStatus, setListingStatus] = useState<string>("draft")
  const [photoCount, setPhotoCount] = useState<number>(0)
  const [documentType, setDocumentType] = useState<string>("Business License")
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)
  const [providerPlanAccess, setProviderPlanAccess] = useState<ProviderPlanAccess>(() =>
    getProviderPlanAccess("sprout"),
  )
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  async function fetchPhotoCount(profileId: string) {
    const supabase = getSupabaseClient()
    const { count } = await supabase
      .from("provider_photos")
      .select("id", { count: "exact", head: true })
      .eq("provider_profile_id", profileId)
    setPhotoCount(count ?? 0)
  }

  useEffect(() => {
    let isMounted = true

    async function loadListingOptions() {
      try {
        const response = await fetch("/api/search/options", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Failed to load listing options: ${response.status}`)
        }

        const payload = (await response.json()) as {
          ageGroups?: Array<{ value?: string; label?: string }>
          programTypes?: Array<{ id?: string; label?: string; slug?: string | null }>
        }

        if (!isMounted) return

        const nextOptions = new Map<string, AgeGroupOption>()
        for (const option of payload.ageGroups ?? []) {
          if (typeof option?.value !== "string" || typeof option?.label !== "string") continue
          const id = normalizeAgeGroupTag(option.value)
          const label = option.label.trim()
          if (!id || !label || nextOptions.has(id)) continue
          nextOptions.set(id, { id, label })
        }

        const nextProgramTypes = new Map<string, ProgramTypeOption>()
        for (const option of payload.programTypes ?? []) {
          if (typeof option?.id !== "string" || typeof option?.label !== "string") continue
          const id = option.id.trim()
          const label = option.label.trim()
          if (!id || !label || nextProgramTypes.has(id)) continue
          nextProgramTypes.set(id, {
            id,
            label,
            slug: typeof option.slug === "string" ? option.slug : null,
          })
        }

        setAvailableAgeGroups(Array.from(nextOptions.values()))
        setAvailableProgramTypes(Array.from(nextProgramTypes.values()))
      } catch (error) {
        console.error("[Manage Listing] Failed to load listing options", error)
      }
    }

    void loadListingOptions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProviderProfile() {
      if (!user) {
        if (isMounted) {
          setProviderProfileId(null)
          setIsLoadingProfile(false)
        }
        return
      }

      const supabase = getSupabaseClient()
      const resolvedProviderProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
      setProviderProfileId(resolvedProviderProfileId)

      const selectWithStatus =
        "business_name, virtual_tour_url, virtual_tour_urls, description, phone, website, address, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, total_capacity, currency_id, listing_status, plan_id"
      const selectWithoutStatus =
        "business_name, virtual_tour_url, virtual_tour_urls, description, phone, website, address, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, total_capacity, currency_id, plan_id"

      try {
        const [profileResult, , currenciesRes, providerProgramTypesResult] = await Promise.all([
          supabase
            .from("provider_profiles")
            .select(selectWithStatus)
            .eq("profile_id", resolvedProviderProfileId)
            .maybeSingle(),
          fetchPhotoCount(resolvedProviderProfileId),
          supabase
            .from("currencies")
            .select("id, code, name, symbol")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("code", { ascending: true }),
          supabase
            .from("provider_profile_program_types")
            .select("program_type_id")
            .eq("provider_profile_id", resolvedProviderProfileId),
        ])

        let { data, error } = profileResult
        if (currenciesRes?.data && isMounted) {
          setCurrencies(currenciesRes.data)
        }

        if (error && isMounted) {
          const msg = error.message ?? ""
          const maybeMissingColumn = /column.*does not exist/i.test(msg) || /undefined column/i.test(msg)
          if (maybeMissingColumn) {
            const fallback = await supabase
              .from("provider_profiles")
              .select(selectWithoutStatus)
              .eq("profile_id", resolvedProviderProfileId)
              .maybeSingle()
            if (!fallback.error && fallback.data) {
              data = { ...fallback.data, listing_status: "draft" } as typeof profileResult.data
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
        setProviderPlanAccess(getProviderPlanAccess(data?.plan_id))
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
        const emailFromAuth = typeof user?.email === "string" ? user.email.trim() : ""
        setEmail(emailFromAuth ?? "")
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
        if (providerProgramTypesResult.data?.length) {
          setSelectedProgramTypeIds(
            providerProgramTypesResult.data
              .map((row) => row.program_type_id)
              .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          )
        }
        if (data?.age_groups_served && data.age_groups_served.length > 0) {
          setAgeGroupsServed(data.age_groups_served.map(normalizeAgeGroupTag))
        }
        if (data?.curriculum_type && Array.isArray(data.curriculum_type) && data.curriculum_type.length > 0) {
          setCurriculumTypes(data.curriculum_type)
        } else if (data?.curriculum_type && typeof data.curriculum_type === "string") {
          setCurriculumTypes([data.curriculum_type])
        }
        if (data?.languages_spoken != null) setLanguagesSpoken(data.languages_spoken)
        if (data?.amenities && data.amenities.length > 0) setAmenities(data.amenities)
        if (data?.opening_time != null) setOpeningTime(data.opening_time)
        if (data?.closing_time != null) setClosingTime(data.closing_time)
        if (data?.daily_fee_from != null) setDailyFeeFrom(String(data.daily_fee_from))
        if (data?.daily_fee_to != null) setDailyFeeTo(String(data.daily_fee_to))
        if (data?.registration_fee != null) setRegistrationFee(String(data.registration_fee))
        if (data?.deposit_fee != null) setDepositFee(String(data.deposit_fee))
        if (data?.meals_fee != null) setMealsFee(String(data.meals_fee))
        setServiceTransport(Boolean(data?.service_transport))
        setServiceExtendedHours(Boolean(data?.service_extended_hours))
        setServicePickupDropoff(Boolean(data?.service_pickup_dropoff))
        setServiceExtracurriculars(Boolean(data?.service_extracurriculars))
        if (data?.currency_id != null) setCurrencyId(data.currency_id)
        if (data?.total_capacity != null) setTotalCapacity(String(data.total_capacity))

        // Restore unsaved draft from sessionStorage when returning from another page (e.g. Photos).
        // Only overwrite with stored values when they are non-empty, so we don't replace DB/signup
        // data with empty strings from a draft saved before the initial load completed.
        const isDraft = !data?.listing_status || data.listing_status === "draft"
        if (isDraft) {
          const stored = loadDraftFromStorage()
          if (stored) {
            if ((stored.businessName ?? "").trim()) setBusinessName(stored.businessName ?? "")
            if ((stored.phone ?? "").trim()) setPhone(stored.phone ?? "")
            if ((stored.email ?? "").trim()) setEmail(stored.email ?? "")
            if ((stored.description ?? "").trim()) setDescription(stored.description ?? "")
            if ((stored.website ?? "").trim()) setWebsite(stored.website ?? "")
            if ((stored.address ?? "").trim() && stored.address !== DEFAULT_ADDRESS) setAddress(stored.address ?? DEFAULT_ADDRESS)
            if (stored.virtualTourUrls?.length) setVirtualTourUrls(stored.virtualTourUrls)
            if (stored.providerTypes?.length) setProviderTypes(stored.providerTypes)
            if (stored.programTypeIds?.length) setSelectedProgramTypeIds(stored.programTypeIds)
            if (stored.ageGroupsServed?.length) {
              setAgeGroupsServed(stored.ageGroupsServed.map(normalizeAgeGroupTag))
            }
            if (stored.curriculumTypes?.length) setCurriculumTypes(stored.curriculumTypes)
            if (stored.languagesSpoken != null && stored.languagesSpoken.trim()) setLanguagesSpoken(stored.languagesSpoken)
            if (stored.amenities?.length) setAmenities(stored.amenities)
            if (stored.openingTime != null && stored.openingTime.trim()) setOpeningTime(stored.openingTime)
            if (stored.closingTime != null && stored.closingTime.trim()) setClosingTime(stored.closingTime)
            if (stored.dailyFeeFrom != null && stored.dailyFeeFrom.trim()) setDailyFeeFrom(stored.dailyFeeFrom)
            if (stored.dailyFeeTo != null && stored.dailyFeeTo.trim()) setDailyFeeTo(stored.dailyFeeTo)
            if (stored.registrationFee != null && stored.registrationFee.trim()) setRegistrationFee(stored.registrationFee)
            if (stored.depositFee != null && stored.depositFee.trim()) setDepositFee(stored.depositFee)
            if (stored.mealsFee != null && stored.mealsFee.trim()) setMealsFee(stored.mealsFee)
            setServiceTransport(Boolean(stored.serviceTransport))
            setServiceExtendedHours(Boolean(stored.serviceExtendedHours))
            setServicePickupDropoff(Boolean(stored.servicePickupDropoff))
            setServiceExtracurriculars(Boolean(stored.serviceExtracurriculars))
            if (stored.currencyId != null && stored.currencyId.trim()) setCurrencyId(stored.currencyId)
            if (stored.totalCapacity != null && stored.totalCapacity.trim()) setTotalCapacity(stored.totalCapacity)
          }
        }
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

  const draftSnapshot = useMemo(
    () => ({
      businessName,
      virtualTourUrls,
      address,
      description,
      phone,
      email,
      website,
      providerTypes,
      programTypeIds: selectedProgramTypeIds,
      ageGroupsServed,
      curriculumTypes,
      languagesSpoken,
      amenities,
      openingTime,
      closingTime,
      dailyFeeFrom,
      dailyFeeTo,
      registrationFee,
      depositFee,
      mealsFee,
      serviceTransport,
      serviceExtendedHours,
      servicePickupDropoff,
      serviceExtracurriculars,
      currencyId,
      totalCapacity,
      listingStatus,
    }),
    [
      businessName,
      virtualTourUrls,
      address,
      description,
      phone,
      email,
      website,
      providerTypes,
      selectedProgramTypeIds,
      ageGroupsServed,
      curriculumTypes,
      languagesSpoken,
      amenities,
      openingTime,
      closingTime,
      dailyFeeFrom,
      dailyFeeTo,
      registrationFee,
      depositFee,
      mealsFee,
      serviceTransport,
      serviceExtendedHours,
      servicePickupDropoff,
      serviceExtracurriculars,
      currencyId,
      totalCapacity,
      listingStatus,
    ],
  )

  // Debounced save: persist draft as user types so data survives navigation before submit
  const DRAFT_SAVE_DEBOUNCE_MS = 400
  useEffect(() => {
    if (isLoadingProfile || listingStatus !== "draft") return
    const t = setTimeout(() => {
      if (typeof window === "undefined") return
      saveDraftToStorage(draftSnapshot)
    }, DRAFT_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [draftSnapshot, isLoadingProfile, listingStatus])

  // Save on visibility change (tab switch / navigate away) as backup
  useEffect(() => {
    const onHide = () => {
      if (typeof window === "undefined" || isLoadingProfile || listingStatus !== "draft") return
      saveDraftToStorage(draftSnapshot)
    }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [draftSnapshot, isLoadingProfile, listingStatus])

  // Save on unmount when navigating to another page (e.g. Reviews, Photos)
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return
      saveDraftToStorage(draftSnapshot)
    }
  }, [draftSnapshot])

  useEffect(() => {
    if (!providerProfileId) return
    const onFocus = () => void fetchPhotoCount(providerProfileId)
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [providerProfileId])

  const isDraftListing = listingStatus === "draft"
  const isPendingListing = listingStatus === "pending"
  const isLiveListing = listingStatus === "active"
  const isSproutPlan = providerPlanAccess.isSprout
  const primaryActionLabel = isDraftListing ? "Submit" : "Save Changes"

  const completionProgress = useMemo(() => {
    if (!isDraftListing) return 100
    if (isSproutPlan) {
      const checks = [
        !!businessName.trim(),
        !!address.trim() && address !== DEFAULT_ADDRESS,
        providerTypes.length > 0,
        documentFiles.length > 0,
      ]
      const filled = checks.filter(Boolean).length
      return Math.round((filled / checks.length) * 100)
    }
    const checks = [
      !!businessName.trim(),
      !!description.trim(),
      !!phone.trim(),
      !!website.trim(),
      !!address.trim() && address !== DEFAULT_ADDRESS,
      providerTypes.length > 0,
      selectedProgramTypeIds.length > 0,
      ageGroupsServed.length > 0,
      curriculumTypes.length > 0,
      !!languagesSpoken.trim(),
      amenities.length > 0,
      !!openingTime.trim(),
      !!closingTime.trim(),
      parseOptionalInteger(dailyFeeFrom) != null,
      parseOptionalInteger(dailyFeeTo) != null,
      parseOptionalInteger(totalCapacity) != null,
      documentFiles.length > 0,
    ]
    const filled = checks.filter(Boolean).length
    return Math.round((filled / checks.length) * 100)
  }, [
    isDraftListing,
    businessName,
    description,
    phone,
    website,
    address,
    providerTypes.length,
    selectedProgramTypeIds.length,
    ageGroupsServed.length,
    curriculumTypes.length,
    languagesSpoken,
    amenities.length,
    openingTime,
    closingTime,
    dailyFeeFrom,
    dailyFeeTo,
    totalCapacity,
    documentFiles.length,
    isSproutPlan,
  ])

  const [showStickySave, setShowStickySave] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      setShowStickySave(window.scrollY > 200)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function validateDraftSubmission(
    values: {
      businessName: string
      description: string
      phone: string
      website: string
      address: string
      providerTypes: ProviderTypeId[]
      programTypeIds: string[]
      ageGroupsServed: string[]
      curriculumTypes: string[]
      languagesSpoken: string
      amenities: string[]
      openingTime: string
      closingTime: string
      dailyFeeFrom: number | null
      dailyFeeTo: number | null
      capacity: number | null
      documentFiles: File[]
    },
  ): string | null {
    const missing: string[] = []
    if (!values.businessName.trim()) missing.push("Business Name")
    if (!values.description.trim()) missing.push("Description")
    if (!values.phone.trim()) missing.push("Phone Number")
    if (!values.website.trim()) missing.push("Website")
    if (!values.address.trim()) missing.push("Address")
    if (values.providerTypes.length === 0) missing.push("Provider Types")
    if (values.programTypeIds.length === 0) missing.push("Program Types")
    if (values.ageGroupsServed.length === 0) missing.push("Age Groups Served")
    if (values.curriculumTypes.length === 0) missing.push("Curriculum Type")
    if (!values.languagesSpoken.trim()) missing.push("Languages Spoken")
    if (values.amenities.length === 0) missing.push("Amenities & Features")
    if (!values.openingTime.trim()) missing.push("Opening Time")
    if (!values.closingTime.trim()) missing.push("Closing Time")
    if (values.dailyFeeFrom == null) missing.push("Daily Fee From")
    if (values.dailyFeeTo == null) missing.push("Daily Fee To")
    if (values.capacity == null) missing.push("Total Capacity")
    if (values.documentFiles.length === 0) missing.push("Verification Documents")
    if (missing.length === 0) return null
    return `Before submitting, please complete: ${missing.join(", ")}.`
  }

  function validateSproutDraftSubmission(values: {
    businessName: string
    address: string
    providerTypes: ProviderTypeId[]
    documentFiles: File[]
  }): string | null {
    const missing: string[] = []
    if (!values.businessName.trim()) missing.push("Business Name")
    if (!values.address.trim() || values.address === DEFAULT_ADDRESS) missing.push("Location")
    if (values.providerTypes.length === 0) missing.push("Provider Type")
    if (values.documentFiles.length === 0) missing.push("Verification Documents")
    if (missing.length === 0) return null
    return `Before submitting, please complete: ${missing.join(", ")}.`
  }

  const handleSave = async () => {
    if (!user || !providerProfileId) {
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
    if (!isSproutPlan && selectedProgramTypeIds.length === 0) {
      setSaveError("Select at least one program type.")
      return
    }

    const normalizedVirtualTourUrls: string[] = []
    if (!isSproutPlan) {
      const enteredUrls = virtualTourUrls.map((url) => url.trim()).filter(Boolean)
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
    }

    setVirtualTourError(null)
    setSaveError(null)
    setSaveSuccess(null)

    const parsedDailyFeeFrom = parseOptionalInteger(dailyFeeFrom)
    const parsedDailyFeeTo = parseOptionalInteger(dailyFeeTo)
    const parsedRegistrationFee = parseOptionalInteger(registrationFee)
    const parsedDepositFee = parseOptionalInteger(depositFee)
    const parsedMealsFee = parseOptionalInteger(mealsFee)
    const capacity = parseOptionalInteger(totalCapacity)

    if (!isSproutPlan && parsedDailyFeeFrom != null && parsedDailyFeeFrom < 0) {
      setSaveError("Daily fee (from) cannot be negative.")
      return
    }
    if (!isSproutPlan && parsedDailyFeeTo != null && parsedDailyFeeTo < 0) {
      setSaveError("Daily fee (to) cannot be negative.")
      return
    }
    if (
      !isSproutPlan &&
      parsedDailyFeeFrom != null &&
      parsedDailyFeeTo != null &&
      parsedDailyFeeFrom > parsedDailyFeeTo
    ) {
      setSaveError("Daily fee (from) must be less than or equal to (to).")
      return
    }
    if (!isSproutPlan && parsedRegistrationFee != null && parsedRegistrationFee < 0) {
      setSaveError("Registration fee cannot be negative.")
      return
    }
    if (!isSproutPlan && parsedDepositFee != null && parsedDepositFee < 0) {
      setSaveError("Deposit cannot be negative.")
      return
    }
    if (!isSproutPlan && parsedMealsFee != null && parsedMealsFee < 0) {
      setSaveError("Meals fee cannot be negative.")
      return
    }
    if (!isSproutPlan && capacity != null && capacity < 0) {
      setSaveError("Total capacity cannot be negative.")
      return
    }

    if (isDraftListing) {
      const validationError = isSproutPlan
        ? validateSproutDraftSubmission({
            businessName: trimmedBusinessName,
            address,
            providerTypes,
            documentFiles,
          })
        : validateDraftSubmission({
            businessName: trimmedBusinessName,
            description,
            phone,
            website,
            address,
            providerTypes,
            programTypeIds: selectedProgramTypeIds,
            ageGroupsServed,
            curriculumTypes,
            languagesSpoken,
            amenities,
            openingTime,
            closingTime,
            dailyFeeFrom: parsedDailyFeeFrom,
            dailyFeeTo: parsedDailyFeeTo,
            capacity,
            documentFiles,
          })
      if (validationError) {
        setSaveError(validationError)
        return
      }
      for (const f of documentFiles) {
        if (f.size > MAX_FILE_SIZE_BYTES) {
          setSaveError(`File "${f.name}" exceeds 10MB limit.`)
          return
        }
      }
    }

    setIsSaving(true)

    try {
      if (isDraftListing && documentFiles.length > 0) {
        const initRes = await fetch("/api/provider/listing-documents/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type: documentType,
            files: documentFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          }),
        })
        const initJson = await initRes.json()
        if (!initJson.success) {
          setSaveError(initJson.error ?? "Failed to prepare document upload.")
          setIsSaving(false)
          return
        }
        const { uploads } = initJson
        const supabase = getSupabaseClient()
        for (let i = 0; i < documentFiles.length; i++) {
          const { path, token } = uploads[i]
          const file = documentFiles[i]
          const { error: uploadError } = await supabase.storage
            .from(PROVIDER_DOCUMENTS_BUCKET)
            .uploadToSignedUrl(path, token, file, { contentType: file.type })
          if (uploadError) {
            setSaveError(`Failed to upload "${file.name}": ${uploadError.message}`)
            setIsSaving(false)
            return
          }
        }
        const completeRes = await fetch("/api/provider/listing-documents/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type: documentType,
            documents: documentFiles.map((f, i) => ({
              path: uploads[i].path,
              mime_type: f.type,
              file_size: f.size,
            })),
          }),
        })
        const completeJson = await completeRes.json()
        if (!completeJson.success) {
          setSaveError(completeJson.error ?? "Failed to save document records.")
          setIsSaving(false)
          return
        }
      }

      const resolvedGooglePlaceId = await resolveGooglePlaceId(
        trimmedBusinessName,
        address,
      )
      const normalizedAgeGroupsServed = Array.from(
        new Set(ageGroupsServed.map(normalizeAgeGroupTag).filter(Boolean)),
      )
      const normalizedProgramTypeIds = Array.from(
        new Set(selectedProgramTypeIds.map((value) => value.trim()).filter(Boolean)),
      )

      const saveResponse = await fetch("/api/provider/save-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitForReview: isDraftListing,
          businessName: trimmedBusinessName,
          googlePlaceId: resolvedGooglePlaceId,
          address,
          providerTypes,
          ...(isSproutPlan
            ? {}
            : {
                virtualTourUrls: normalizedVirtualTourUrls,
                description,
                phone,
                website: normalizeProviderWebsiteUrl(website.trim()),
                ageGroupsServed: normalizedAgeGroupsServed,
                curriculumTypes,
                languagesSpoken,
                amenities,
                openingTime,
                closingTime,
                dailyFeeFrom: parsedDailyFeeFrom,
                dailyFeeTo: parsedDailyFeeTo,
                registrationFee: parsedRegistrationFee,
                depositFee: parsedDepositFee,
                mealsFee: parsedMealsFee,
                serviceTransport,
                serviceExtendedHours,
                servicePickupDropoff,
                serviceExtracurriculars,
                currencyId,
                totalCapacity: capacity,
                programTypeIds: normalizedProgramTypeIds,
              }),
        }),
      })
      const savePayload = (await saveResponse.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null

      if (!saveResponse.ok || !savePayload?.success) {
        const errorMessage = savePayload?.error ?? "Unable to save changes right now. Please try again."
        console.error("[Manage Listing] Save error:", errorMessage)
        setSaveError(
          process.env.NODE_ENV === "development" && errorMessage
            ? `Save failed: ${errorMessage}`
            : "Unable to save changes right now. Please try again."
        )
        return
      }

      await enrichGoogleCacheAfterSave(
        trimmedBusinessName,
        address.trim(),
        resolvedGooglePlaceId,
      )

      setBusinessName(trimmedBusinessName)
      setVirtualTourUrls(normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : [""])
      if (isDraftListing) {
        setListingStatus("pending")
        setDocumentFiles([])
        try {
          sessionStorage.removeItem("eld:post-submit-photos-tour-shown")
        } catch {
          // ignore
        }
      }
      clearDraftFromStorage()
      let successMessage = isDraftListing
        ? isSproutPlan
          ? "Thank you. Your basic profile has been submitted and is now under admin review."
          : "Thank you. Your profile has been submitted and is now under admin review."
        : isSproutPlan
          ? "Your basic listing details have been saved."
          : "All listing details have been saved."
      if (!isSproutPlan && photoCount === 0)
        successMessage += " Important: Add photos in the Photos section to complete your listing."
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
    <div className="w-full space-y-6 pb-24">
      <Suspense fallback={null}>
        <ProfileTour isReady={!isLoadingProfile} variant={isSproutPlan ? "sprout" : "full"} />
      </Suspense>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h1 className="text-2xl font-bold text-foreground">Manage Listing</h1>
            <Badge
              variant={
                isLiveListing ? "default" : isPendingListing ? "outline" : "secondary"
              }
              className={
                isPendingListing
                  ? "border-amber-500/60 text-amber-700 dark:text-amber-400 dark:border-amber-500/60"
                  : isLiveListing
                    ? "bg-green-600 hover:bg-green-600/90"
                    : ""
              }
            >
              {isDraftListing ? "Draft" : isPendingListing ? "Pending Review" : "Live"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {isDraftListing
              ? isSproutPlan
                ? "Complete your basic profile and submit it for admin approval."
                : "Complete your profile and submit for admin approval."
              : isPendingListing
                ? "Your submission is under review. Editing is locked until approval."
                : isSproutPlan
                  ? "Update your basic business details."
                  : "Update your business information and program details"}
          </p>
          {isDraftListing && !isLoadingProfile && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium">{completionProgress}%</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
              {!isSproutPlan && photoCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  After submitting, add photos in{" "}
                  <Link href="/dashboard/provider/photos" className="text-primary hover:underline">
                    Photos
                  </Link>{" "}
                  to showcase your space.
                </p>
              )}
            </div>
          )}
        </div>
        {!isPendingListing && (
          <Button onClick={handleSave} disabled={isSaving || isLoadingProfile} className="shrink-0" data-tour-submit>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? (isDraftListing ? "Submitting..." : "Saving...") : primaryActionLabel}
          </Button>
        )}
      </div>

      {/* Status messages */}
      {saveError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
      {saveSuccess && (
        <Alert className="border-green-500/40 bg-green-500/5" role="status" aria-live="polite">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">{saveSuccess}</AlertDescription>
        </Alert>
      )}
      {isPendingListing && !saveSuccess && !saveError && !isLoadingProfile && (
        <Alert className="border-primary/40 bg-primary/5" role="status">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Under review</AlertTitle>
          <AlertDescription>
            {isSproutPlan
              ? "Thank you. Your basic listing is under review. We&apos;ll notify you when it&apos;s live on the directory."
              : "Thank you. Your listing is under review. We&apos;ll notify you when it&apos;s live on the directory. Next step: Add photos in the Photos section to showcase your facility."}
          </AlertDescription>
        </Alert>
      )}
      {!isSproutPlan ? (
        <PostSubmitPhotosTour
          show={isPendingListing && photoCount === 0}
          isReady={!isLoadingProfile}
        />
      ) : null}

      {isLoadingProfile ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : isSproutPlan ? (
        <fieldset disabled={isPendingListing || isSaving || isLoadingProfile} className="space-y-6">
          <Card className="border-border/50 border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Basic Listing Details</CardTitle>
                  <CardDescription>
                    Sprout includes only the basics: name, location, provider type, and verification documents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-tour-business-name>
                  <FieldLabel>Business Name</FieldLabel>
                  <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
                </Field>

                <Field data-tour-location>
                  <FieldLabel>Location</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={detectAddressFromCurrentLocation}
                      disabled={isDetectingAddress}
                      className="shrink-0"
                    >
                      {isDetectingAddress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-1.5" />
                          Use location
                        </>
                      )}
                    </Button>
                  </div>
                  {(addressError || !mapsApiKey) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {addressError ??
                        "Google Maps API key is not configured. We can detect coordinates but not city/state."}
                    </p>
                  )}
                </Field>

                <Field data-tour-provider-type>
                  <FieldLabel>Provider Type</FieldLabel>
                  <FieldDescription>Select the provider types you want displayed on your basic listing.</FieldDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {PROVIDER_TYPES.map((type) => {
                      const selected = providerTypes.includes(type.id)
                      return (
                        <Badge
                          key={type.id}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                          onClick={() =>
                            setProviderTypes((prev) =>
                              selected ? prev.filter((id) => id !== type.id) : [...prev, type.id],
                            )
                          }
                        >
                          {type.label}
                        </Badge>
                      )
                    })}
                  </div>
                </Field>

                {isDraftListing ? (
                  <>
                    <Separator />
                    <Field data-tour-verification>
                      <FieldLabel>
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Verification Documents (required to submit)
                        </span>
                      </FieldLabel>
                      <FieldDescription>
                        Upload at least one document for admin verification. PDF or images (JPEG, PNG, WebP). Max 10MB per file.
                      </FieldDescription>
                      <div className="mt-2 space-y-2">
                        <div>
                          <label
                            htmlFor="document_type"
                            className="text-xs font-medium text-muted-foreground mb-1.5 block"
                          >
                            Document Type
                          </label>
                          <select
                            id="document_type"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            disabled={isPendingListing}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {DOCUMENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Input
                            id="documents"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                            multiple
                            className="cursor-pointer"
                            onChange={(e) => {
                              const files = e.target.files
                              if (files) setDocumentFiles(Array.from(files))
                            }}
                          />
                          {documentFiles.length > 0 ? (
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {documentFiles.length} file{documentFiles.length !== 1 ? "s" : ""} selected
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Field>
                  </>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-muted/20">
            <CardHeader>
              <CardTitle>Upgrade For More</CardTitle>
              <CardDescription>
                Upgrade to Grow or Thrive to unlock availability, leads, photos, FAQs, website tools, analytics, and your full enhanced profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/dashboard/provider/subscription">Compare plans</Link>
              </Button>
            </CardContent>
          </Card>
        </fieldset>
      ) : (
      <fieldset disabled={isPendingListing || isSaving || isLoadingProfile} className="space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1 bg-muted/60">
          <TabsTrigger value="business" className="flex items-center gap-2" data-tour-tab-business>
            <Building2 className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="program" className="flex items-center gap-2" data-tour-tab-program>
            <GraduationCap className="h-4 w-4" />
            Program Details
          </TabsTrigger>
          <TabsTrigger value="operating" className="flex items-center gap-2" data-tour-tab-operating>
            <Clock className="h-4 w-4" />
            Operating Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6">
      {/* Business Information */}
      <Card className="border-border/50 border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Basic details about your childcare center.
              </CardDescription>
            </div>
          </div>
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
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </Field>
            </div>

            <Field>
              <FieldLabel>Address</FieldLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectAddressFromCurrentLocation}
                  disabled={isDetectingAddress}
                  className="shrink-0"
                >
                  {isDetectingAddress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-1.5" />
                      Use location
                    </>
                  )}
                </Button>
              </div>
              {(addressError || !mapsApiKey) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {addressError ??
                    "Google Maps API key is not configured. We can detect coordinates but not city/state."}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Videos (YouTube URLs)</FieldLabel>
              <FieldDescription>
                Add one or more YouTube links to show as videos on your public provider page.
              </FieldDescription>
              <div className="space-y-3 mt-2">
                {virtualTourUrls.map((url, index) => (
                  <div
                    key={`virtual-tour-${index}`}
                    className="flex gap-2 items-center rounded-lg border border-border bg-muted/30 p-2"
                  >
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(event) => updateVirtualTourUrl(index, event.target.value)}
                      className="border-0 bg-transparent focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVirtualTourInput(index)}
                      aria-label={`Remove video ${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
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
              {virtualTourError && (
                <p className="text-xs text-destructive mt-2" role="alert">{virtualTourError}</p>
              )}
            </Field>

            {isDraftListing && (
              <>
                <Separator />
                <Field>
                  <FieldLabel>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Verification Documents (required to submit)
                    </span>
                  </FieldLabel>
                  <FieldDescription>
                    Upload at least one document for admin verification. PDF or images (JPEG, PNG, WebP). Max 10MB per file.
                  </FieldDescription>
                  <div className="mt-2 space-y-2">
                    <div>
                      <label
                        htmlFor="document_type"
                        className="text-xs font-medium text-muted-foreground mb-1.5 block"
                      >
                        Document Type
                      </label>
                      <select
                        id="document_type"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        disabled={isPendingListing}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {DOCUMENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Input
                        id="documents"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                        multiple
                        className="cursor-pointer"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) setDocumentFiles(Array.from(files))
                        }}
                      />
                      {documentFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {documentFiles.length} file{documentFiles.length !== 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>
                  </div>
                </Field>
              </>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="program" className="mt-6">
      {/* Program Details */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>Information about your programs and services</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Provider Types</FieldLabel>
              <FieldDescription>
                Select all that apply to your organisation (e.g. nursery, preschool, afterschool program).
              </FieldDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {PROVIDER_TYPES.map((type) => {
                  const selected = providerTypes.includes(type.id)
                  return (
                    <Badge
                      key={type.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                      onClick={() =>
                        setProviderTypes((prev) =>
                          selected ? prev.filter((id) => id !== type.id) : [...prev, type.id],
                        )
                      }
                    >
                      {type.label}
                    </Badge>
                  )
                })}
              </div>
            </Field>

            <Separator />

            <Field>
              <FieldLabel>Program Types</FieldLabel>
              <FieldDescription>
                Choose the programs you actually offer from the directory program types.
              </FieldDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {availableProgramTypes.map((programType) => {
                  const selected = selectedProgramTypeIds.includes(programType.id)
                  return (
                    <Badge
                      key={programType.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                      onClick={() =>
                        setSelectedProgramTypeIds((prev) =>
                          selected
                            ? prev.filter((id) => id !== programType.id)
                            : [...prev, programType.id],
                        )
                      }
                    >
                      {programType.label}
                    </Badge>
                  )
                })}
                {availableProgramTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active program types are available.</p>
                ) : null}
              </div>
            </Field>

            <Separator />

            <Field>
              <FieldLabel>Age Groups Served</FieldLabel>
              <div className="flex flex-wrap gap-2 pt-2">
                {availableAgeGroups.map((age) => {
                  const selected = ageGroupsServed.includes(age.id)
                  return (
                    <Badge
                      key={age.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                      onClick={() =>
                        setAgeGroupsServed((prev) =>
                          selected ? prev.filter((id) => id !== age.id) : [...prev, age.id],
                        )
                      }
                    >
                      {age.label}
                    </Badge>
                  )
                })}
                {availableAgeGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active age groups are available.</p>
                ) : null}
              </div>
            </Field>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Curriculum Type</FieldLabel>
                <div className="flex flex-wrap gap-2 pt-2">
                  {CURRICULUM_OPTIONS.map((curriculum) => {
                    const selected = curriculumTypes.includes(curriculum.id)
                    return (
                      <Badge
                        key={curriculum.id}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                        onClick={() =>
                          setCurriculumTypes((prev) =>
                            selected ? prev.filter((id) => id !== curriculum.id) : [...prev, curriculum.id],
                          )
                        }
                      >
                        {curriculum.label}
                      </Badge>
                    )
                  })}
                </div>
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
              <div className="flex flex-wrap gap-2 pt-2">
                {AMENITIES.map((a) => {
                  const selected = amenities.includes(a.id)
                  return (
                    <Badge
                      key={a.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:opacity-90"
                      onClick={() =>
                        setAmenities((prev) =>
                          selected ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                        )
                      }
                    >
                      {a.label}
                    </Badge>
                  )
                })}
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="operating" className="mt-6">
      {/* Operating Details */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Operating Details</CardTitle>
              <CardDescription>Hours, daily fees, and pricing details</CardDescription>
            </div>
          </div>
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

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Pricing and Capacity</p>
                <p className="text-sm text-muted-foreground">
                  Select the currency for fee amounts. Daily fee and pricing components will be displayed with the
                  selected symbol.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field>
                  <FieldLabel>Daily Fee From</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={dailyFeeFrom}
                    onChange={(e) => setDailyFeeFrom(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Daily Fee To</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={dailyFeeTo}
                    onChange={(e) => setDailyFeeTo(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Registration Fee</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Deposit</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={depositFee}
                    onChange={(e) => setDepositFee(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Meals Fee</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={mealsFee}
                    onChange={(e) => setMealsFee(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Currency</FieldLabel>
                  <Select value={currencyId || "none"} onValueChange={(v) => setCurrencyId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select currency</SelectItem>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} ({c.symbol}) – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Total Capacity</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(e.target.value)}
                    placeholder="e.g. 60"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
                  <Checkbox checked={serviceTransport} onCheckedChange={(checked) => setServiceTransport(Boolean(checked))} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Transport</p>
                    <p className="text-sm text-muted-foreground">Offer transport as an additional paid service.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
                  <Checkbox
                    checked={serviceExtendedHours}
                    onCheckedChange={(checked) => setServiceExtendedHours(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Extended Hours</p>
                    <p className="text-sm text-muted-foreground">Show that families can book care beyond standard hours.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
                  <Checkbox
                    checked={servicePickupDropoff}
                    onCheckedChange={(checked) => setServicePickupDropoff(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Pickup / Drop-off</p>
                    <p className="text-sm text-muted-foreground">Indicate whether pickup and drop-off support is available.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
                  <Checkbox
                    checked={serviceExtracurriculars}
                    onCheckedChange={(checked) => setServiceExtracurriculars(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Extracurriculars</p>
                    <p className="text-sm text-muted-foreground">Highlight extra paid activities offered alongside the core program.</p>
                  </div>
                </label>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
        </TabsContent>

      </Tabs>
      </fieldset>
      )}

      {/* Save button mobile */}
      {!isPendingListing && (
        <div className="sm:hidden">
          <Button onClick={handleSave} disabled={isSaving || isLoadingProfile} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? (isDraftListing ? "Submitting..." : "Saving...") : primaryActionLabel}
          </Button>
        </div>
      )}

      {/* Sticky save bar */}
      {!isPendingListing && showStickySave && (
        <div
          className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 border-t border-border bg-background/95 backdrop-blur px-4 py-3"
          role="region"
          aria-label="Save actions"
        >
          <div className="flex w-full items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-muted-foreground"
            >
              <ChevronUp className="h-4 w-4 mr-1.5" />
              Scroll to top
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoadingProfile}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? (isDraftListing ? "Submitting..." : "Saving...") : primaryActionLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
