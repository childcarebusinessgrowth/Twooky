"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { assertServerRole } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { deriveProviderSlug } from "@/lib/provider-slug"
import { resolveGooglePlaceIdFromText } from "@/lib/google-place-id"
import { parseYouTubeUrl } from "@/lib/youtube"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const MAX_FAQS = 30
const MAX_VIRTUAL_TOURS = 8

export type AdminProviderCountryOption = { id: string; name: string }
export type AdminProviderCityOption = { id: string; country_id: string; name: string }
export type AdminProviderLanguageOption = { id: string; name: string }
export type AdminProviderCurriculumOption = { id: string; name: string }
export type AdminProviderCurrencyOption = { id: string; code: string; name: string; symbol: string }

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

export async function getAdminProviderCreateOptions(): Promise<{
  countries: AdminProviderCountryOption[]
  cities: AdminProviderCityOption[]
  languages: AdminProviderLanguageOption[]
  curriculum: AdminProviderCurriculumOption[]
  currencies: AdminProviderCurrencyOption[]
}> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const [
    { data: countries },
    { data: cities },
    { data: languages },
    { data: curriculum },
    { data: currencies, error: currenciesError },
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
  }
}

export async function createAdminProvider(formData: FormData): Promise<CreateAdminProviderResult> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const businessName = asTrimmedText(formData.get("businessName"))
  const description = asTrimmedText(formData.get("description"))
  const phone = asTrimmedText(formData.get("phone"))
  const website = asTrimmedText(formData.get("website"))
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

  const monthlyTuitionFrom = parseNullableInt(asTrimmedText(formData.get("monthlyTuitionFrom")))
  const monthlyTuitionTo = parseNullableInt(asTrimmedText(formData.get("monthlyTuitionTo")))
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
  if (!city) return { ok: false, error: "City is required." }
  if (!["active", "pending", "inactive"].includes(listingStatus)) {
    return { ok: false, error: "Invalid listing status." }
  }
  if (monthlyTuitionFrom != null && monthlyTuitionFrom < 0) {
    return { ok: false, error: "Monthly tuition (from) cannot be negative." }
  }
  if (monthlyTuitionTo != null && monthlyTuitionTo < 0) {
    return { ok: false, error: "Monthly tuition (to) cannot be negative." }
  }
  if (
    monthlyTuitionFrom != null &&
    monthlyTuitionTo != null &&
    monthlyTuitionFrom > monthlyTuitionTo
  ) {
    return { ok: false, error: "Monthly tuition (from) must be less than or equal to (to)." }
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

  if (currencyId) {
    const { data: currencyRow, error: currencyError } = await supabase
      .from("currencies")
      .select("id")
      .eq("id", currencyId)
      .eq("is_active", true)
      .maybeSingle()
    if (currencyError) return { ok: false, error: currencyError.message }
    if (!currencyRow) return { ok: false, error: "Selected currency is invalid." }
    resolvedCurrencyId = currencyRow.id
  }

  if (countryId) {
    const { data: countryRow, error: countryError } = await supabase
      .from("countries")
      .select("id")
      .eq("id", countryId)
      .eq("is_active", true)
      .maybeSingle()
    if (countryError) return { ok: false, error: countryError.message }
    if (!countryRow) return { ok: false, error: "Selected country is invalid." }
    resolvedCountryId = countryRow.id
  }

  if (cityId) {
    const cityQuery = supabase
      .from("cities")
      .select("id, country_id, name")
      .eq("id", cityId)
      .eq("is_active", true)
      .maybeSingle()
    const { data: cityRow, error: cityError } = await cityQuery
    if (cityError) return { ok: false, error: cityError.message }
    if (!cityRow) return { ok: false, error: "Selected city is invalid." }
    if (resolvedCountryId && cityRow.country_id !== resolvedCountryId) {
      return { ok: false, error: "Selected city does not belong to selected country." }
    }
    resolvedCityId = cityRow.id
    if (!resolvedCountryId) resolvedCountryId = cityRow.country_id
    if (!resolvedCityName) resolvedCityName = cityRow.name
  }

  const profileId = randomUUID()
  const resolvedGooglePlaceId = await resolveGooglePlaceIdFromText(businessName, address)
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
      monthly_tuition_from: monthlyTuitionFrom,
      monthly_tuition_to: monthlyTuitionTo,
      total_capacity: totalCapacity,
      currency_id: resolvedCurrencyId,
      listing_status: listingStatus,
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
      return { ok: false, error: insertProfileError.message }
    }

    if (photos.length > 0) {
      await ensureProviderPhotosBucket()
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

        const { error: insertPhotoError } = await supabase.from("provider_photos").insert({
          provider_profile_id: profileId,
          storage_path: storagePath,
          caption: photoCaptions[i] || null,
          is_primary: i === primaryPhotoIndex,
          sort_order: i,
        })
        if (insertPhotoError) {
          throw new Error(insertPhotoError.message)
        }
      }
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
    }
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
  revalidatePath(`/providers/${slug}`)
  return { ok: true, profileId, slug }
}

export type UpdateAdminProviderResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string }

export async function updateAdminProvider(
  profileId: string,
  formData: FormData
): Promise<UpdateAdminProviderResult> {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const businessName = asTrimmedText(formData.get("businessName"))
  const description = asTrimmedText(formData.get("description"))
  const phone = asTrimmedText(formData.get("phone"))
  const website = asTrimmedText(formData.get("website"))
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

  const monthlyTuitionFrom = parseNullableInt(asTrimmedText(formData.get("monthlyTuitionFrom")))
  const monthlyTuitionTo = parseNullableInt(asTrimmedText(formData.get("monthlyTuitionTo")))
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
  if (!city) return { ok: false, error: "City is required." }
  if (!["active", "pending", "inactive"].includes(listingStatus)) {
    return { ok: false, error: "Invalid listing status." }
  }
  if (monthlyTuitionFrom != null && monthlyTuitionFrom < 0) {
    return { ok: false, error: "Monthly tuition (from) cannot be negative." }
  }
  if (monthlyTuitionTo != null && monthlyTuitionTo < 0) {
    return { ok: false, error: "Monthly tuition (to) cannot be negative." }
  }
  if (
    monthlyTuitionFrom != null &&
    monthlyTuitionTo != null &&
    monthlyTuitionFrom > monthlyTuitionTo
  ) {
    return { ok: false, error: "Monthly tuition (from) must be less than or equal to (to)." }
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

  if (currencyId) {
    const { data: currencyRow, error: currencyError } = await supabase
      .from("currencies")
      .select("id")
      .eq("id", currencyId)
      .eq("is_active", true)
      .maybeSingle()
    if (currencyError) return { ok: false, error: currencyError.message }
    if (!currencyRow) return { ok: false, error: "Selected currency is invalid." }
    resolvedCurrencyId = currencyRow.id
  }

  if (countryId) {
    const { data: countryRow, error: countryError } = await supabase
      .from("countries")
      .select("id")
      .eq("id", countryId)
      .eq("is_active", true)
      .maybeSingle()
    if (countryError) return { ok: false, error: countryError.message }
    if (!countryRow) return { ok: false, error: "Selected country is invalid." }
    resolvedCountryId = countryRow.id
  }

  if (cityId) {
    const cityQuery = supabase
      .from("cities")
      .select("id, country_id, name")
      .eq("id", cityId)
      .eq("is_active", true)
      .maybeSingle()
    const { data: cityRow, error: cityError } = await cityQuery
    if (cityError) return { ok: false, error: cityError.message }
    if (!cityRow) return { ok: false, error: "Selected city is invalid." }
    if (resolvedCountryId && cityRow.country_id !== resolvedCountryId) {
      return { ok: false, error: "Selected city does not belong to selected country." }
    }
    resolvedCityId = cityRow.id
    if (!resolvedCountryId) resolvedCountryId = cityRow.country_id
    if (!resolvedCityName) resolvedCityName = cityRow.name
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from("provider_profiles")
    .select("profile_id, provider_slug, listing_status")
    .eq("profile_id", profileId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!existingProfile) return { ok: false, error: "Listing not found." }

  const previousStatus = (existingProfile.listing_status ?? "pending") as string

  const { error: updateProfileError } = await supabase
    .from("provider_profiles")
    .update({
      business_name: businessName,
      phone: phone || null,
      city: resolvedCityName || null,
      description: description || null,
      website: website || null,
      address: address || null,
      provider_types: providerTypes.length > 0 ? providerTypes : null,
      age_groups_served: ageGroupsServed.length > 0 ? ageGroupsServed : null,
      curriculum_type: curriculumTypes.length > 0 ? curriculumTypes : null,
      languages_spoken: languagesSpoken || null,
      amenities: amenities.length > 0 ? amenities : null,
      opening_time: openingTime || null,
      closing_time: closingTime || null,
      monthly_tuition_from: monthlyTuitionFrom,
      monthly_tuition_to: monthlyTuitionTo,
      total_capacity: totalCapacity,
      currency_id: resolvedCurrencyId,
      listing_status: listingStatus,
      featured,
      country_id: resolvedCountryId,
      city_id: resolvedCityId,
      virtual_tour_url: virtualTourUrls[0] ?? null,
      virtual_tour_urls: virtualTourUrls.length > 0 ? virtualTourUrls : null,
    })
    .eq("profile_id", profileId)

  if (updateProfileError) return { ok: false, error: updateProfileError.message }

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

        const { error: insertPhotoError } = await supabase.from("provider_photos").insert({
          provider_profile_id: profileId,
          storage_path: storagePath,
          caption: photoCaptions[i] || null,
          is_primary: !hasPrimary && i === primaryPhotoIndex,
          sort_order: nextSortOrder,
        })
        if (insertPhotoError) throw new Error(insertPhotoError.message)
        nextSortOrder += 1
      }
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

  revalidatePath("/admin/listings")
  revalidatePath(`/admin/listings/${profileId}`)
  revalidatePath("/search")
  if (existingProfile.provider_slug) {
    revalidatePath(`/providers/${existingProfile.provider_slug}`)
  }
  return { ok: true, profileId }
}
