"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { assertAdminPermission } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { deriveProviderSlug } from "@/lib/provider-slug"
import { resolveGooglePlaceIdFromText } from "@/lib/google-place-id"
import { enrichProviderGooglePlaceCache } from "@/lib/google-place-enrichment"
import { parseYouTubeUrl } from "@/lib/youtube"
import { normalizeProviderWebsiteUrl } from "@/lib/normalize-provider-website-url"
import { startPerfTimer } from "@/lib/perf-metrics"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_FAQS = 30
const MAX_VIRTUAL_TOURS = 8
const GOOGLE_PLACE_TIMEOUT_MS = 1200

let providerPhotosBucketReadyPromise: Promise<void> | null = null

export type AdminProviderCountryOption = { id: string; name: string }
export type AdminProviderCityOption = { id: string; country_id: string; name: string }
export type AdminProviderLanguageOption = { id: string; name: string }
export type AdminProviderCurriculumOption = { id: string; name: string }
export type AdminProviderCurrencyOption = { id: string; code: string; name: string; symbol: string }
export type AdminProviderAgeGroupOption = { id: string; tag: string; age_range: string }

export type CreateAdminProviderResult =
  | { ok: true; profileId: string; slug: string }
  | { ok: false; error: string }

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function asTrimmedText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function parseNullableInt(value: string): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function parseBooleanCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1"
}

function normalizeVirtualTourUrls(rawValues: string[]): { urls: string[]; error?: string } {
  const deduped: string[] = []
  for (let i = 0; i < rawValues.length; i += 1) {
    const raw = rawValues[i].trim()
    if (!raw) continue
    const parsed = parseYouTubeUrl(raw)
    if (!parsed) {
      return { urls: [], error: `Video ${i + 1} has an invalid YouTube URL.` }
    }
    if (!deduped.includes(parsed.normalizedUrl)) {
      deduped.push(parsed.normalizedUrl)
    }
  }
  if (deduped.length > MAX_VIRTUAL_TOURS) {
    return { urls: [], error: `You can add up to ${MAX_VIRTUAL_TOURS} virtual tour videos.` }
  }
  return { urls: deduped }
}

async function ensureProviderPhotosBucket() {
  if (providerPhotosBucketReadyPromise) {
    await providerPhotosBucketReadyPromise
    return
  }

  providerPhotosBucketReadyPromise = (async () => {
    const supabase = getSupabaseAdminClient()
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw new Error(listError.message)

    const exists = buckets?.some((bucket) => bucket.name === PROVIDER_PHOTOS_BUCKET)
    if (exists) return

    const { error: createError } = await supabase.storage.createBucket(PROVIDER_PHOTOS_BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    })
    if (createError && !createError.message.toLowerCase().includes("already")) {
      throw new Error(createError.message)
    }
  })()

  try {
    await providerPhotosBucketReadyPromise
  } catch (error) {
    providerPhotosBucketReadyPromise = null
    throw error
  }
}

async function createUniqueProviderSlug(baseName: string): Promise<string> {
  const supabase = getSupabaseAdminClient()
  const fallback = `provider-${randomUUID().slice(0, 8)}`
  const base = deriveProviderSlug(baseName) || fallback

  for (let i = 0; i < 300; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const { data, error } = await supabase
      .from("provider_profiles")
      .select("profile_id")
      .eq("provider_slug", candidate)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return candidate
  }

  return `${base}-${randomUUID().slice(0, 6)}`
}

async function cleanupStoragePaths(paths: string[]) {
  if (paths.length === 0) return
  const supabase = getSupabaseAdminClient()
  await supabase.storage.from(PROVIDER_PHOTOS_BUCKET).remove(paths)
}

async function resolveGooglePlaceIdFast(businessName: string, address: string): Promise<string | null> {
  const timeout = new Promise<string | null>((resolve) => {
    setTimeout(() => resolve(null), GOOGLE_PLACE_TIMEOUT_MS)
  })
  try {
    return await Promise.race([resolveGooglePlaceIdFromText(businessName, address), timeout])
  } catch {
    return null
  }
}

async function hasPrimaryPhotoForProvider(profileId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  const { count, error } = await supabase
    .from("provider_photos")
    .select("id", { head: true, count: "exact" })
    .eq("provider_profile_id", profileId)
    .eq("is_primary", true)
  if (error) return false
  return (count ?? 0) > 0
}

export async function getAdminProviderCreateOptions(): Promise<{
  countries: AdminProviderCountryOption[]
  cities: AdminProviderCityOption[]
  languages: AdminProviderLanguageOption[]
  curriculum: AdminProviderCurriculumOption[]
  currencies: AdminProviderCurrencyOption[]
  ageGroups: AdminProviderAgeGroupOption[]
}> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()

  const [
    { data: countries },
    { data: cities },
    { data: languages },
    { data: curriculum },
    { data: currencies, error: currenciesError },
    { data: ageGroups },
  ] = await Promise.all([
    supabase
      .from("countries")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("cities")
      .select("id, country_id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("languages")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("curriculum_philosophies")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("currencies")
      .select("id, code, name, symbol")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
    supabase
      .from("age_groups")
      .select("id, tag, age_range")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("age_range", { ascending: true }),
  ])

  if (currenciesError) {
    console.error("[getAdminProviderCreateOptions] Currencies load failed:", currenciesError.message)
  }

  return {
    countries: (countries ?? []).map((row) => ({ id: row.id, name: row.name })),
    cities: (cities ?? []).map((row) => ({ id: row.id, country_id: row.country_id, name: row.name })),
    languages: (languages ?? []).map((row) => ({ id: row.id, name: row.name })),
    curriculum: (curriculum ?? []).map((row) => ({ id: row.id, name: row.name })),
    currencies: (currencies ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      symbol: row.symbol,
    })),
    ageGroups: (ageGroups ?? []).map((row) => ({
      id: row.id,
      tag: row.tag,
      age_range: row.age_range,
    })),
  }
}

export async function createAdminProvider(formData: FormData): Promise<CreateAdminProviderResult> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("createAdminProvider")

  const businessName = asTrimmedText(formData.get("businessName"))
  const description = asTrimmedText(formData.get("description"))
  const phone = asTrimmedText(formData.get("phone"))
  const website = normalizeProviderWebsiteUrl(asTrimmedText(formData.get("website")))
  const address = asTrimmedText(formData.get("address"))
  const city = asTrimmedText(formData.get("city"))
  const listingStatus = asTrimmedText(formData.get("listingStatus")) || "active"
  /** Bulk import sets this so new rows stay unverified until an admin enables the badge. */
  const skipVerifiedBadgeOnCreate = asTrimmedText(formData.get("skipVerifiedBadgeOnCreate")) === "true"
  const featured = parseBooleanCheckbox(formData.get("featured"))
  const curriculumTypes = formData
    .getAll("curriculumTypes")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const languagesSpoken = asTrimmedText(formData.get("languagesSpoken"))
  const openingTime = asTrimmedText(formData.get("openingTime"))
  const closingTime = asTrimmedText(formData.get("closingTime"))
  const countryId = asTrimmedText(formData.get("countryId"))
  const cityId = asTrimmedText(formData.get("cityId"))
  const currencyId = asTrimmedText(formData.get("currencyId"))

  const dailyFeeFrom = parseNullableInt(asTrimmedText(formData.get("dailyFeeFrom")))
  const dailyFeeTo = parseNullableInt(asTrimmedText(formData.get("dailyFeeTo")))
  const registrationFee = parseNullableInt(asTrimmedText(formData.get("registrationFee")))
  const depositFee = parseNullableInt(asTrimmedText(formData.get("depositFee")))
  const mealsFee = parseNullableInt(asTrimmedText(formData.get("mealsFee")))
  const serviceTransport = parseBooleanCheckbox(formData.get("serviceTransport"))
  const serviceExtendedHours = parseBooleanCheckbox(formData.get("serviceExtendedHours"))
  const servicePickupDropoff = parseBooleanCheckbox(formData.get("servicePickupDropoff"))
  const serviceExtracurriculars = parseBooleanCheckbox(formData.get("serviceExtracurriculars"))
  const totalCapacity = parseNullableInt(asTrimmedText(formData.get("totalCapacity")))

  const providerTypes = formData
    .getAll("providerTypes")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const ageGroupsServed = formData
    .getAll("ageGroupsServed")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const amenities = formData
    .getAll("amenities")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)

  const virtualTourRawValues = formData
    .getAll("virtualTourUrls")
    .map((v) => (typeof v === "string" ? v : ""))
  const virtualTourResult = normalizeVirtualTourUrls(virtualTourRawValues)
  if (virtualTourResult.error) {
    return { ok: false, error: virtualTourResult.error }
  }
  const virtualTourUrls = virtualTourResult.urls

  if (!businessName) return { ok: false, error: "Business name is required." }
  if (!description) return { ok: false, error: "Description is required." }
  if (!address) return { ok: false, error: "Address is required." }
  if (!city && !cityId) return { ok: false, error: "Directory city is required." }
  if (!["active", "pending", "inactive"].includes(listingStatus)) {
    return { ok: false, error: "Invalid listing status." }
  }
  if (dailyFeeFrom != null && dailyFeeFrom < 0) {
    return { ok: false, error: "Daily fee (from) cannot be negative." }
  }
  if (dailyFeeTo != null && dailyFeeTo < 0) {
    return { ok: false, error: "Daily fee (to) cannot be negative." }
  }
  if (
    dailyFeeFrom != null &&
    dailyFeeTo != null &&
    dailyFeeFrom > dailyFeeTo
  ) {
    return { ok: false, error: "Daily fee (from) must be less than or equal to (to)." }
  }
  if (registrationFee != null && registrationFee < 0) {
    return { ok: false, error: "Registration fee cannot be negative." }
  }
  if (depositFee != null && depositFee < 0) {
    return { ok: false, error: "Deposit cannot be negative." }
  }
  if (mealsFee != null && mealsFee < 0) {
    return { ok: false, error: "Meals fee cannot be negative." }
  }

  const rawFaqs = asTrimmedText(formData.get("faqsJson"))
  let faqs: Array<{ question: string; answer: string }> = []
  if (rawFaqs) {
    try {
      const parsed = JSON.parse(rawFaqs) as Array<{ question?: string; answer?: string }>
      faqs = parsed
        .map((f) => ({
          question: (f.question ?? "").trim(),
          answer: (f.answer ?? "").trim(),
        }))
        .filter((f) => f.question && f.answer)
    } catch {
      return { ok: false, error: "Invalid FAQ payload." }
    }
  }
  if (faqs.length > MAX_FAQS) {
    return { ok: false, error: `You can add up to ${MAX_FAQS} FAQs.` }
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  const rawPhotoCaptions = asTrimmedText(formData.get("photoCaptionsJson"))
  let photoCaptions: string[] = []
  if (rawPhotoCaptions) {
    try {
      const parsed = JSON.parse(rawPhotoCaptions) as string[]
      photoCaptions = parsed.map((caption) => (caption ?? "").trim())
    } catch {
      return { ok: false, error: "Invalid photo captions payload." }
    }
  }
  if (photoCaptions.length < photos.length) {
    photoCaptions = [...photoCaptions, ...new Array(photos.length - photoCaptions.length).fill("")]
  }

  const primaryPhotoIndexRaw = asTrimmedText(formData.get("primaryPhotoIndex"))
  const primaryPhotoIndex = primaryPhotoIndexRaw ? Number.parseInt(primaryPhotoIndexRaw, 10) : 0
  if (photos.length > 0 && (Number.isNaN(primaryPhotoIndex) || primaryPhotoIndex < 0 || primaryPhotoIndex >= photos.length)) {
    return { ok: false, error: "Invalid primary photo selection." }
  }

  for (const photo of photos) {
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return { ok: false, error: "Only PNG, JPG, and WebP photos are supported." }
    }
    if (photo.size > MAX_IMAGE_SIZE_BYTES) {
      return { ok: false, error: "Each photo must be 10MB or less." }
    }
  }

  let resolvedCountryId: string | null = null
  let resolvedCityId: string | null = null
  let resolvedCityName = city
  let resolvedCurrencyId: string | null = null

  const [{ data: currencyRow, error: currencyError }, { data: countryRow, error: countryError }, { data: cityRow, error: cityError }] =
    await Promise.all([
      currencyId
        ? supabase
            .from("currencies")
            .select("id")
            .eq("id", currencyId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      countryId
        ? supabase
            .from("countries")
            .select("id")
            .eq("id", countryId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      cityId
        ? supabase
            .from("cities")
            .select("id, country_id, name")
            .eq("id", cityId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
  perf.mark("validated_location_lookups")

  if (currencyError) return { ok: false, error: currencyError.message }
  if (currencyId && !currencyRow) return { ok: false, error: "Selected currency is invalid." }
  if (currencyRow) resolvedCurrencyId = currencyRow.id

  if (countryError) return { ok: false, error: countryError.message }
  if (countryId && !countryRow) return { ok: false, error: "Selected country is invalid." }
  if (countryRow) resolvedCountryId = countryRow.id

  if (cityError) return { ok: false, error: cityError.message }
  if (cityId && !cityRow) return { ok: false, error: "Selected city is invalid." }
  if (cityRow) {
    if (resolvedCountryId && cityRow.country_id !== resolvedCountryId) {
      return { ok: false, error: "Selected city does not belong to selected country." }
    }
    resolvedCityId = cityRow.id
    if (!resolvedCountryId) resolvedCountryId = cityRow.country_id
    if (!resolvedCityName) resolvedCityName = cityRow.name
  }

  const profileId = randomUUID()
  const resolvedGooglePlaceId = await resolveGooglePlaceIdFast(businessName, address)
  perf.mark("resolved_google_place", { hit: Boolean(resolvedGooglePlaceId) })
  let slug: string
  try {
    slug = await createUniqueProviderSlug(businessName)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to generate provider slug." }
  }

  const uploadedPaths: string[] = []

  try {
    const { error: insertProfileError } = await supabase.from("provider_profiles").insert({
      profile_id: profileId,
      provider_slug: slug,
      business_name: businessName,
      phone: phone || null,
      city: resolvedCityName || null,
      description: description || null,
      website: website || null,
      address: address || null,
      google_place_id: resolvedGooglePlaceId,
      provider_types: providerTypes.length > 0 ? providerTypes : null,
      age_groups_served: ageGroupsServed.length > 0 ? ageGroupsServed : null,
      curriculum_type: curriculumTypes.length > 0 ? curriculumTypes : null,
      languages_spoken: languagesSpoken || null,
      amenities: amenities.length > 0 ? amenities : null,
      opening_time: openingTime || null,
      closing_time: closingTime || null,
      daily_fee_from: dailyFeeFrom,
      daily_fee_to: dailyFeeTo,
      registration_fee: registrationFee,
      deposit_fee: depositFee,
      meals_fee: mealsFee,
      service_transport: serviceTransport,
      service_extended_hours: serviceExtendedHours,
      service_pickup_dropoff: servicePickupDropoff,
      service_extracurriculars: serviceExtracurriculars,
      total_capacity: totalCapacity,
      currency_id: resolvedCurrencyId,
      listing_status: listingStatus,
      verified_provider_badge: skipVerifiedBadgeOnCreate ? false : listingStatus === "active",
      featured,
      is_admin_managed: true,
      country_id: resolvedCountryId,
      city_id: resolvedCityId,
      virtual_tour_url: virtualTourUrls[0] ?? null,
      virtual_tour_urls: virtualTourUrls.length > 0 ? virtualTourUrls : null,
    })
    if (insertProfileError) {
      if (insertProfileError.code === "23505" && insertProfileError.message.toLowerCase().includes("provider_slug")) {
        return { ok: false, error: "A provider with a similar slug already exists. Please try a different business name." }
      }
      if (
        insertProfileError.code === "23505" &&
        insertProfileError.message.toLowerCase().includes("provider_profiles_business_address_city_unique_idx")
      ) {
        return { ok: false, error: "A provider with the same business name and location already exists." }
      }
      return { ok: false, error: insertProfileError.message }
    }
    perf.mark("inserted_provider_profile")

    if (photos.length > 0) {
      await ensureProviderPhotosBucket()
      const photoRows: Array<{
        provider_profile_id: string
        storage_path: string
        caption: string | null
        is_primary: boolean
        sort_order: number
      }> = []
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i]
        const safeName = sanitizeFilename(photo.name || "image")
        const storagePath = `${profileId}/${randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from(PROVIDER_PHOTOS_BUCKET)
          .upload(storagePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type,
          })
        if (uploadError) {
          throw new Error(uploadError.message)
        }
        uploadedPaths.push(storagePath)
        photoRows.push({
          provider_profile_id: profileId,
          storage_path: storagePath,
          caption: photoCaptions[i] || null,
          is_primary: i === primaryPhotoIndex,
          sort_order: i,
        })
      }
      const { error: insertPhotoError } = await supabase.from("provider_photos").insert(photoRows)
      if (insertPhotoError) {
        throw new Error(insertPhotoError.message)
      }
      perf.mark("uploaded_and_inserted_photos", { count: photos.length })
    }

    if (faqs.length > 0) {
      const rows = faqs.map((faq, index) => ({
        provider_profile_id: profileId,
        question: faq.question,
        answer: faq.answer,
        sort_order: index,
      }))
      const { error: faqError } = await supabase.from("provider_faqs").insert(rows)
      if (faqError) throw new Error(faqError.message)
      perf.mark("inserted_faqs", { count: faqs.length })
    }

    const hasPrimaryPhoto = await hasPrimaryPhotoForProvider(profileId)
    await enrichProviderGooglePlaceCache({
      providerProfileId: profileId,
      businessName,
      address,
      placeId: resolvedGooglePlaceId,
      hasPrimaryPhoto,
      logContext: "admin-create-provider",
    })
    perf.mark("enriched_google_place_cache")
  } catch (error) {
    await supabase.from("provider_profiles").delete().eq("profile_id", profileId)
    await cleanupStoragePaths(uploadedPaths)
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create provider.",
    }
  }

  revalidatePath("/admin/listings")
  revalidatePath(`/admin/listings/${profileId}`)
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  revalidatePath(`/providers/${slug}`)
  perf.end({ ok: true })
  return { ok: true, profileId, slug }
}

export type UpdateAdminProviderResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string }

export async function updateAdminProvider(
  profileId: string,
  formData: FormData
): Promise<UpdateAdminProviderResult> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("updateAdminProvider", { profile_id: profileId })

  const businessName = asTrimmedText(formData.get("businessName"))
  const description = asTrimmedText(formData.get("description"))
  const phone = asTrimmedText(formData.get("phone"))
  const website = normalizeProviderWebsiteUrl(asTrimmedText(formData.get("website")))
  const address = asTrimmedText(formData.get("address"))
  const city = asTrimmedText(formData.get("city"))
  const listingStatus = asTrimmedText(formData.get("listingStatus")) || "active"
  const featured = parseBooleanCheckbox(formData.get("featured"))
  const curriculumTypes = formData
    .getAll("curriculumTypes")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const languagesSpoken = asTrimmedText(formData.get("languagesSpoken"))
  const openingTime = asTrimmedText(formData.get("openingTime"))
  const closingTime = asTrimmedText(formData.get("closingTime"))
  const countryId = asTrimmedText(formData.get("countryId"))
  const cityId = asTrimmedText(formData.get("cityId"))
  const currencyId = asTrimmedText(formData.get("currencyId"))

  const dailyFeeFrom = parseNullableInt(asTrimmedText(formData.get("dailyFeeFrom")))
  const dailyFeeTo = parseNullableInt(asTrimmedText(formData.get("dailyFeeTo")))
  const registrationFee = parseNullableInt(asTrimmedText(formData.get("registrationFee")))
  const depositFee = parseNullableInt(asTrimmedText(formData.get("depositFee")))
  const mealsFee = parseNullableInt(asTrimmedText(formData.get("mealsFee")))
  const serviceTransport = parseBooleanCheckbox(formData.get("serviceTransport"))
  const serviceExtendedHours = parseBooleanCheckbox(formData.get("serviceExtendedHours"))
  const servicePickupDropoff = parseBooleanCheckbox(formData.get("servicePickupDropoff"))
  const serviceExtracurriculars = parseBooleanCheckbox(formData.get("serviceExtracurriculars"))
  const totalCapacity = parseNullableInt(asTrimmedText(formData.get("totalCapacity")))

  const providerTypes = formData
    .getAll("providerTypes")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const ageGroupsServed = formData
    .getAll("ageGroupsServed")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
  const amenities = formData
    .getAll("amenities")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)

  const virtualTourRawValues = formData
    .getAll("virtualTourUrls")
    .map((v) => (typeof v === "string" ? v : ""))
  const virtualTourResult = normalizeVirtualTourUrls(virtualTourRawValues)
  if (virtualTourResult.error) {
    return { ok: false, error: virtualTourResult.error }
  }
  const virtualTourUrls = virtualTourResult.urls

  if (!businessName) return { ok: false, error: "Business name is required." }
  if (!description) return { ok: false, error: "Description is required." }
  if (!address) return { ok: false, error: "Address is required." }
  if (!city && !cityId) return { ok: false, error: "Directory city is required." }
  if (!["active", "pending", "inactive"].includes(listingStatus)) {
    return { ok: false, error: "Invalid listing status." }
  }
  if (dailyFeeFrom != null && dailyFeeFrom < 0) {
    return { ok: false, error: "Daily fee (from) cannot be negative." }
  }
  if (dailyFeeTo != null && dailyFeeTo < 0) {
    return { ok: false, error: "Daily fee (to) cannot be negative." }
  }
  if (
    dailyFeeFrom != null &&
    dailyFeeTo != null &&
    dailyFeeFrom > dailyFeeTo
  ) {
    return { ok: false, error: "Daily fee (from) must be less than or equal to (to)." }
  }
  if (registrationFee != null && registrationFee < 0) {
    return { ok: false, error: "Registration fee cannot be negative." }
  }
  if (depositFee != null && depositFee < 0) {
    return { ok: false, error: "Deposit cannot be negative." }
  }
  if (mealsFee != null && mealsFee < 0) {
    return { ok: false, error: "Meals fee cannot be negative." }
  }

  const rawFaqs = asTrimmedText(formData.get("faqsJson"))
  let faqs: Array<{ question: string; answer: string }> = []
  if (rawFaqs) {
    try {
      const parsed = JSON.parse(rawFaqs) as Array<{ question?: string; answer?: string }>
      faqs = parsed
        .map((f) => ({
          question: (f.question ?? "").trim(),
          answer: (f.answer ?? "").trim(),
        }))
        .filter((f) => f.question && f.answer)
    } catch {
      return { ok: false, error: "Invalid FAQ payload." }
    }
  }
  if (faqs.length > MAX_FAQS) {
    return { ok: false, error: `You can add up to ${MAX_FAQS} FAQs.` }
  }

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  const rawPhotoCaptions = asTrimmedText(formData.get("photoCaptionsJson"))
  let photoCaptions: string[] = []
  if (rawPhotoCaptions) {
    try {
      const parsed = JSON.parse(rawPhotoCaptions) as string[]
      photoCaptions = parsed.map((caption) => (caption ?? "").trim())
    } catch {
      return { ok: false, error: "Invalid photo captions payload." }
    }
  }
  if (photoCaptions.length < photos.length) {
    photoCaptions = [...photoCaptions, ...new Array(photos.length - photoCaptions.length).fill("")]
  }

  const primaryPhotoIndexRaw = asTrimmedText(formData.get("primaryPhotoIndex"))
  const primaryPhotoIndex = primaryPhotoIndexRaw ? Number.parseInt(primaryPhotoIndexRaw, 10) : 0
  if (photos.length > 0 && (Number.isNaN(primaryPhotoIndex) || primaryPhotoIndex < 0 || primaryPhotoIndex >= photos.length)) {
    return { ok: false, error: "Invalid primary photo selection." }
  }

  for (const photo of photos) {
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return { ok: false, error: "Only PNG, JPG, and WebP photos are supported." }
    }
    if (photo.size > MAX_IMAGE_SIZE_BYTES) {
      return { ok: false, error: "Each photo must be 10MB or less." }
    }
  }

  let resolvedCountryId: string | null = null
  let resolvedCityId: string | null = null
  let resolvedCityName = city
  let resolvedCurrencyId: string | null = null

  const [{ data: currencyRow, error: currencyError }, { data: countryRow, error: countryError }, { data: cityRow, error: cityError }] =
    await Promise.all([
      currencyId
        ? supabase
            .from("currencies")
            .select("id")
            .eq("id", currencyId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      countryId
        ? supabase
            .from("countries")
            .select("id")
            .eq("id", countryId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      cityId
        ? supabase
            .from("cities")
            .select("id, country_id, name")
            .eq("id", cityId)
            .eq("is_active", true)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
  perf.mark("validated_location_lookups")

  if (currencyError) return { ok: false, error: currencyError.message }
  if (currencyId && !currencyRow) return { ok: false, error: "Selected currency is invalid." }
  if (currencyRow) resolvedCurrencyId = currencyRow.id

  if (countryError) return { ok: false, error: countryError.message }
  if (countryId && !countryRow) return { ok: false, error: "Selected country is invalid." }
  if (countryRow) resolvedCountryId = countryRow.id

  if (cityError) return { ok: false, error: cityError.message }
  if (cityId && !cityRow) return { ok: false, error: "Selected city is invalid." }
  if (cityRow) {
    if (resolvedCountryId && cityRow.country_id !== resolvedCountryId) {
      return { ok: false, error: "Selected city does not belong to selected country." }
    }
    resolvedCityId = cityRow.id
    if (!resolvedCountryId) resolvedCountryId = cityRow.country_id
    if (!resolvedCityName) resolvedCityName = cityRow.name
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from("provider_profiles")
    .select("profile_id, provider_slug, listing_status, google_place_id")
    .eq("profile_id", profileId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existingProfile) return { ok: false, error: "Listing not found." }
  perf.mark("loaded_existing_profile")

  const resolvedGooglePlaceId = await resolveGooglePlaceIdFast(businessName, address)
  const nextGooglePlaceId = resolvedGooglePlaceId ?? existingProfile.google_place_id ?? null

  const previousStatus = (existingProfile.listing_status ?? "pending") as string
  const shouldVerify =
    listingStatus === "active" &&
    (previousStatus === "pending" || previousStatus === "draft")

  const { error: updateProfileError } = await supabase
    .from("provider_profiles")
    .update({
      business_name: businessName,
      phone: phone || null,
      city: resolvedCityName || null,
      description: description || null,
      website: website || null,
      address: address || null,
      google_place_id: nextGooglePlaceId,
      provider_types: providerTypes.length > 0 ? providerTypes : null,
      age_groups_served: ageGroupsServed.length > 0 ? ageGroupsServed : null,
      curriculum_type: curriculumTypes.length > 0 ? curriculumTypes : null,
      languages_spoken: languagesSpoken || null,
      amenities: amenities.length > 0 ? amenities : null,
      opening_time: openingTime || null,
      closing_time: closingTime || null,
      daily_fee_from: dailyFeeFrom,
      daily_fee_to: dailyFeeTo,
      registration_fee: registrationFee,
      deposit_fee: depositFee,
      meals_fee: mealsFee,
      service_transport: serviceTransport,
      service_extended_hours: serviceExtendedHours,
      service_pickup_dropoff: servicePickupDropoff,
      service_extracurriculars: serviceExtracurriculars,
      total_capacity: totalCapacity,
      currency_id: resolvedCurrencyId,
      listing_status: listingStatus,
      featured,
      country_id: resolvedCountryId,
      city_id: resolvedCityId,
      virtual_tour_url: virtualTourUrls[0] ?? null,
      virtual_tour_urls: virtualTourUrls.length > 0 ? virtualTourUrls : null,
      ...(shouldVerify ? { verified_provider_badge: true } : {}),
    })
    .eq("profile_id", profileId)

  if (updateProfileError) {
    if (
      updateProfileError.code === "23505" &&
      updateProfileError.message.toLowerCase().includes("provider_profiles_business_address_city_unique_idx")
    ) {
      return { ok: false, error: "A provider with the same business name and location already exists." }
    }
    return { ok: false, error: updateProfileError.message }
  }
  perf.mark("updated_provider_profile")

  if (listingStatus === "active" && previousStatus !== "active") {
    await supabase.from("provider_notifications").insert({
      provider_profile_id: profileId,
      type: "listing_confirmed",
      title: "Your listing is live",
      message: "Your provider profile has been approved and is now visible on the directory.",
      href: "/dashboard/provider",
    })
    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/provider/listing")
  }

  const { error: deleteFaqsError } = await supabase
    .from("provider_faqs")
    .delete()
    .eq("provider_profile_id", profileId)
  if (deleteFaqsError) return { ok: false, error: deleteFaqsError.message }

  if (faqs.length > 0) {
    const rows = faqs.map((faq, index) => ({
      provider_profile_id: profileId,
      question: faq.question,
      answer: faq.answer,
      sort_order: index,
    }))
    const { error: faqError } = await supabase.from("provider_faqs").insert(rows)
    if (faqError) return { ok: false, error: faqError.message }
    perf.mark("reinserted_faqs", { count: faqs.length })
  }

  const uploadedPaths: string[] = []

  if (photos.length > 0) {
    const { data: existingPhotos, error: existingPhotosError } = await supabase
      .from("provider_photos")
      .select("id, is_primary, sort_order")
      .eq("provider_profile_id", profileId)
    if (existingPhotosError) return { ok: false, error: existingPhotosError.message }

    const hasPrimary = (existingPhotos ?? []).some((row) => row.is_primary)
    const maxSortOrder = (existingPhotos ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? -1), -1)
    let nextSortOrder = maxSortOrder + 1

    try {
      await ensureProviderPhotosBucket()
      const photoRows: Array<{
        provider_profile_id: string
        storage_path: string
        caption: string | null
        is_primary: boolean
        sort_order: number
      }> = []
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i]
        const safeName = sanitizeFilename(photo.name || "image")
        const storagePath = `${profileId}/${randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from(PROVIDER_PHOTOS_BUCKET)
          .upload(storagePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type,
          })
        if (uploadError) throw new Error(uploadError.message)
        uploadedPaths.push(storagePath)
        photoRows.push({
          provider_profile_id: profileId,
          storage_path: storagePath,
          caption: photoCaptions[i] || null,
          is_primary: !hasPrimary && i === primaryPhotoIndex,
          sort_order: nextSortOrder,
        })
        nextSortOrder += 1
      }
      const { error: insertPhotoError } = await supabase.from("provider_photos").insert(photoRows)
      if (insertPhotoError) throw new Error(insertPhotoError.message)
      perf.mark("uploaded_and_inserted_photos", { count: photos.length })
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(PROVIDER_PHOTOS_BUCKET).remove(uploadedPaths)
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to upload photos.",
      }
    }
  }

  const hasPrimaryPhoto = await hasPrimaryPhotoForProvider(profileId)
  await enrichProviderGooglePlaceCache({
    providerProfileId: profileId,
    businessName,
    address,
    placeId: nextGooglePlaceId,
    hasPrimaryPhoto,
    logContext: "admin-update-provider",
  })
  perf.mark("enriched_google_place_cache")

  revalidatePath("/admin/listings")
  revalidatePath(`/admin/listings/${profileId}`)
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (existingProfile.provider_slug) {
    revalidatePath(`/providers/${existingProfile.provider_slug}`)
  }
  perf.end({ ok: true })
  return { ok: true, profileId }
}
