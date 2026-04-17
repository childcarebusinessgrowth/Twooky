import type { SupabaseClient } from "@supabase/supabase-js"
import { parseYouTubeUrl } from "@/lib/youtube"
import {
  hasFreshCachedGoogleReviews,
  readCachedGooglePlaceSummary,
  type ProviderGoogleCacheRow,
} from "@/lib/google-place-cache"
import { normalizeAgeRangeLabel } from "@/lib/age-range-label"
import { formatDailyFeeRange } from "@/lib/currency"
import {
  getReviewsByProviderProfileId,
  type PublicReviewRow,
} from "@/lib/parent-engagement"
import { buildProviderCardImageUrl } from "@/lib/provider-card-image"
import {
  getProviderProgramTypesByProfileIds,
  type ProviderProgramType,
} from "@/lib/provider-program-types"
import { getProviderPlanAccess, normalizeProviderPlanId } from "@/lib/provider-plan-access"
import {
  extractDirectoryBadgeRelation,
  toDirectoryBadgeView,
  type DirectoryBadgeRelationRow,
  type DirectoryBadgeView,
} from "@/lib/directory-badges"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

export type PublicAvailabilityStatus = "openings" | "waitlist" | "full"

export type PublicProviderView = {
  profileId: string
  planId: string
  isSproutPlan: boolean
  slug: string
  name: string
  image: string
  address: string
  platformRating: number
  platformReviewCount: number
  displayRating: number
  displayReviewCount: number
  googleReviewsUrl: string | null
  rating: number
  reviewCount: number
  providerTypes: string[]
  programTypes: ProviderProgramType[]
  description: string
  ageGroups: string[]
  hours: string
  languages: string[]
  curriculumTypes: string[]
  website: string
  phone: string
  priceRange: string
  currencySymbol: string
  currencyCode: string | null
  registrationFee: number | null
  depositFee: number | null
  mealsFee: number | null
  additionalServices: string[]
  mealsIncluded: boolean
  outdoorSpace: boolean
  specialNeeds: boolean
  inquiriesEnabled: boolean
  earlyLearningExcellenceBadge: boolean
  verifiedProviderBadge: boolean
  verifiedProviderBadgeColor: string | null
  availabilityStatus: PublicAvailabilityStatus
  availableSpotsCount: number | null
  availabilityLabel: string
  images: string[]
  photos: Array<{ id: string; url: string; caption: string | null }>
  virtualTourEmbedUrls: string[]
  reviews: PublicReviewRow[]
  faqs: Array<{ question: string; answer: string }>
  directoryBadges: DirectoryBadgeView[]
}

const AVAILABILITY_LABELS: Record<PublicAvailabilityStatus, string> = {
  openings: "Spots Available",
  waitlist: "Waitlist",
  full: "Full",
}

type AgeGroupRow = {
  tag: string
  age_range: string
  sort_order?: number | null
}

function normalizeAvailabilityStatus(value: unknown): PublicAvailabilityStatus {
  if (value === "waitlist" || value === "full") return value
  return "openings"
}

function ageUnitToMonths(amount: number, unit: string): number {
  if (unit === "y") return amount * 12
  if (unit === "w") return amount / 4.345
  return amount
}

function getAgeRangeFallbackSortValue(label: string): number {
  const normalized = label.trim().toLowerCase()
  if (!normalized) return Number.MAX_SAFE_INTEGER

  const compactRangeMatch = normalized.match(/^(\d+(?:\.\d+)?)(w|m|y)?-(\d+(?:\.\d+)?)(w|m|y)?\+?$/)
  if (compactRangeMatch) {
    const amount = Number(compactRangeMatch[1])
    const unit = compactRangeMatch[2] ?? compactRangeMatch[4]
    if (unit) return ageUnitToMonths(amount, unit)
  }

  const openEndedMatch = normalized.match(/^(\d+(?:\.\d+)?)(w|m|y)\+$/)
  if (openEndedMatch) {
    return ageUnitToMonths(Number(openEndedMatch[1]), openEndedMatch[2])
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)(w|m|y)\b/)
  if (!match) return Number.MAX_SAFE_INTEGER

  return ageUnitToMonths(Number(match[1]), match[2])
}

function buildSortedAgeRanges(
  servedTags: string[] | null | undefined,
  ageGroupRows: AgeGroupRow[]
): string[] {
  if (!servedTags?.length) return []

  const ageGroupByTag = new Map<string, AgeGroupRow>()
  for (const row of ageGroupRows) {
    ageGroupByTag.set(row.tag, row)
    if (row.tag === "school_age") {
      ageGroupByTag.set("schoolage", row)
    }
  }

  return [...servedTags]
    .map((tag, index) => {
      const row = ageGroupByTag.get(tag)
      const label = normalizeAgeRangeLabel(row?.age_range ?? tag)
      return {
        index,
        label,
        sortValue: getAgeRangeFallbackSortValue(label),
        dbSortOrder: row?.sort_order ?? Number.MAX_SAFE_INTEGER,
      }
    })
    .sort((a, b) => a.sortValue - b.sortValue || a.dbSortOrder - b.dbSortOrder || a.index - b.index)
    .map((item) => item.label)
}

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&w=800"

const PUBLIC_PROVIDER_SELECT_WITH_GOOGLE_CACHE =
  "profile_id, plan_id, provider_slug, business_name, description, address, phone, website, google_place_id, google_fallback_storage_path, google_photo_reference_cached, google_rating_cached, google_review_count_cached, google_reviews_url_cached, google_reviews_cached_at, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, currency_id, currencies(symbol, code), virtual_tour_url, virtual_tour_urls, is_admin_managed, owner_profile_id, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count"

const PUBLIC_PROVIDER_SELECT_LEGACY =
  "profile_id, plan_id, provider_slug, business_name, description, address, phone, website, google_place_id, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, currency_id, currencies(symbol, code), virtual_tour_url, virtual_tour_urls, is_admin_managed, owner_profile_id, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count"

function isMissingColumnError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase()
  return m.includes("does not exist") && m.includes("column")
}

export async function getActivePublicProviderBySlug(
  supabase: SupabaseClient,
  slug: string,
  baseUrl: string
): Promise<PublicProviderView | null> {
  const slugTrimmed = slug.trim()
  if (!slugTrimmed) return null

  let { data: profile, error: profileError } = await supabase
    .from("provider_profiles")
    .select(PUBLIC_PROVIDER_SELECT_WITH_GOOGLE_CACHE)
    .ilike("provider_slug", slugTrimmed)
    .eq("listing_status", "active")
    .maybeSingle()

  if (profileError && isMissingColumnError(profileError.message)) {
    const retry = await supabase
      .from("provider_profiles")
      .select(PUBLIC_PROVIDER_SELECT_LEGACY)
      .ilike("provider_slug", slugTrimmed)
      .eq("listing_status", "active")
      .maybeSingle()
    profile = retry.data
      ? {
          ...retry.data,
          google_fallback_storage_path: null,
          google_photo_reference_cached: null,
          google_rating_cached: null,
          google_review_count_cached: null,
          google_reviews_url_cached: null,
          google_reviews_cached_at: null,
        }
      : null
    profileError = retry.error
  }

  if (profileError || !profile) return null

  const profileId = profile.profile_id

  const [photosResult, reviews, faqsResult, ageGroupsResult, programTypesByProfile, providerBadgesResult] = await Promise.all([
    supabase
      .from("provider_photos")
      .select("id, storage_path, caption")
      .eq("provider_profile_id", profileId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getReviewsByProviderProfileId(supabase, profileId),
    supabase
      .from("provider_faqs")
      .select("question, answer")
      .eq("provider_profile_id", profileId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("age_groups")
      .select("tag, age_range, sort_order")
      .eq("is_active", true),
    getProviderProgramTypesByProfileIds(supabase, [profileId]),
    supabase
      .from("provider_profile_badges")
      .select("provider_profile_id, directory_badges(id, name, description, color, icon)")
      .eq("provider_profile_id", profileId),
  ])

  const cachedGoogle = profile as ProviderGoogleCacheRow
  const googleReviewSummary = readCachedGooglePlaceSummary(cachedGoogle)

  const photoRows = photosResult.data ?? []
  const firstPhotoStoragePath = photoRows[0]?.storage_path ?? null
  const googleFallbackStoragePath =
    (profile as { google_fallback_storage_path?: string | null }).google_fallback_storage_path?.trim() || null
  const photos = photoRows.map((row) => ({
    id: row.id,
    url: `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${row.storage_path}`,
    caption: row.caption,
  }))
  const images = photos.map((p) => p.url)
  const image =
    buildProviderCardImageUrl(
      firstPhotoStoragePath,
      googleFallbackStoragePath,
      googleReviewSummary?.photoReference ?? null,
      baseUrl,
    ) ?? PLACEHOLDER_IMAGE

  const virtualTourUrls =
    profile.virtual_tour_urls && profile.virtual_tour_urls.length > 0
      ? profile.virtual_tour_urls
      : profile.virtual_tour_url
        ? [profile.virtual_tour_url]
        : []
  const virtualTourEmbedUrls: string[] = []
  for (const url of virtualTourUrls) {
    const parsed = parseYouTubeUrl(url)
    if (parsed && !virtualTourEmbedUrls.includes(parsed.embedUrl)) {
      virtualTourEmbedUrls.push(parsed.embedUrl)
    }
  }

  const from = profile.daily_fee_from
  const to = profile.daily_fee_to
  const currencyRow = profile.currencies as { symbol?: string; code?: string } | null
  const currencySymbol = currencyRow?.symbol ?? "$"
  const currencyCode = currencyRow?.code ?? null
  const priceRange = formatDailyFeeRange(from, to, currencySymbol)
  const registrationFee = profile.registration_fee ?? null
  const depositFee = profile.deposit_fee ?? null
  const mealsFee = profile.meals_fee ?? null
  const additionalServices: string[] = []
  if (profile.service_transport) additionalServices.push("Transport")
  if (profile.service_extended_hours) additionalServices.push("Extended Hours")
  if (profile.service_pickup_dropoff) additionalServices.push("Pickup / Drop-off")
  if (profile.service_extracurriculars) additionalServices.push("Extracurriculars")

  const hours =
    profile.opening_time && profile.closing_time
      ? `${profile.opening_time} – ${profile.closing_time}`
      : "Contact for hours"

  const amenities = profile.amenities ?? []
  const mealsIncluded = amenities.some(
    (a: unknown) => typeof a === "string" && a.toLowerCase().includes("meal")
  )
  const outdoorSpace = amenities.some(
    (a: unknown) =>
      typeof a === "string" &&
      (a.toLowerCase().includes("outdoor") || a.toLowerCase().includes("play"))
  )
  const specialNeeds = amenities.some(
    (a: unknown) =>
      typeof a === "string" &&
      (a.toLowerCase().includes("special") || a.toLowerCase().includes("need"))
  )

  const languages = (profile.languages_spoken ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean)

  const platformReviewCount = reviews.length
  const platformRating =
    platformReviewCount > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / platformReviewCount
      : 0
  const shouldUseGoogleSummary =
    platformReviewCount === 0 && hasFreshCachedGoogleReviews(profile as ProviderGoogleCacheRow)
  const displayReviewCount = shouldUseGoogleSummary
    ? (googleReviewSummary?.reviewCount ?? platformReviewCount)
    : platformReviewCount
  const displayRating = shouldUseGoogleSummary
    ? (googleReviewSummary?.rating ?? platformRating)
    : platformRating
  const googleReviewsUrl = shouldUseGoogleSummary ? (googleReviewSummary?.reviewsUrl ?? null) : null

  const faqs = (faqsResult.data ?? []).map((row) => ({
    question: row.question,
    answer: row.answer,
  }))
  const ageRanges = buildSortedAgeRanges(
    profile.age_groups_served ?? [],
    (ageGroupsResult.data ?? []) as AgeGroupRow[]
  )
  const availabilityStatus = normalizeAvailabilityStatus(profile.availability_status)
  const availableSpotsCount = profile.available_spots_count ?? null
  const availabilityLabel =
    availabilityStatus === "openings" && availableSpotsCount != null && availableSpotsCount > 0
      ? `Spots Available (${availableSpotsCount})`
      : AVAILABILITY_LABELS[availabilityStatus]
  const programTypes = programTypesByProfile[profileId] ?? []
  const ownerProfileId = (profile as { owner_profile_id?: string | null }).owner_profile_id ?? null
  const isClaimed = typeof ownerProfileId === "string" && ownerProfileId.trim().length > 0
  const planId = normalizeProviderPlanId((profile as { plan_id?: string | null }).plan_id)
  const planAccess = getProviderPlanAccess(planId)
  const isSproutPlan = planAccess.isSprout
  const directoryBadges = ((providerBadgesResult.data ?? []) as Array<{
    directory_badges: DirectoryBadgeRelationRow[] | DirectoryBadgeRelationRow | null
  }>)
    .map((row) => extractDirectoryBadgeRelation(row.directory_badges))
    .filter((badge): badge is DirectoryBadgeRelationRow => badge !== null)
    .map((badge) => toDirectoryBadgeView(badge))

  return {
    profileId,
    planId,
    isSproutPlan,
    slug: profile.provider_slug ?? slug,
    name: profile.business_name ?? "Provider",
    image: isSproutPlan ? PLACEHOLDER_IMAGE : image,
    address: profile.address ?? "",
    platformRating: isSproutPlan ? 0 : platformRating,
    platformReviewCount: isSproutPlan ? 0 : platformReviewCount,
    displayRating: isSproutPlan ? 0 : displayRating,
    displayReviewCount: isSproutPlan ? 0 : displayReviewCount,
    googleReviewsUrl: isSproutPlan ? null : googleReviewsUrl,
    rating: isSproutPlan ? 0 : displayRating,
    reviewCount: isSproutPlan ? 0 : displayReviewCount,
    providerTypes: profile.provider_types ?? [],
    programTypes: isSproutPlan ? [] : programTypes,
    description: isSproutPlan ? "" : (profile.description ?? ""),
    ageGroups: isSproutPlan ? [] : ageRanges,
    hours: isSproutPlan ? "" : hours,
    languages: isSproutPlan ? [] : languages,
    curriculumTypes: isSproutPlan
      ? []
      : Array.isArray(profile.curriculum_type)
        ? profile.curriculum_type
        : profile.curriculum_type
          ? [profile.curriculum_type]
          : [],
    website: isSproutPlan ? "" : (profile.website ?? ""),
    phone: isSproutPlan ? "" : (profile.phone ?? ""),
    priceRange: isSproutPlan ? "" : priceRange,
    currencySymbol,
    currencyCode,
    registrationFee: isSproutPlan ? null : registrationFee,
    depositFee: isSproutPlan ? null : depositFee,
    mealsFee: isSproutPlan ? null : mealsFee,
    additionalServices: isSproutPlan ? [] : additionalServices,
    mealsIncluded: isSproutPlan ? false : mealsIncluded,
    outdoorSpace: isSproutPlan ? false : outdoorSpace,
    specialNeeds: isSproutPlan ? false : specialNeeds,
    inquiriesEnabled: planAccess.canReceivePublicInquiries && (!profile.is_admin_managed || isClaimed),
    earlyLearningExcellenceBadge: isSproutPlan ? false : (profile.early_learning_excellence_badge ?? false),
    verifiedProviderBadge: isSproutPlan ? false : (profile.verified_provider_badge ?? false),
    verifiedProviderBadgeColor: profile.verified_provider_badge_color ?? "emerald",
    availabilityStatus: isSproutPlan ? "openings" : availabilityStatus,
    availableSpotsCount: isSproutPlan ? null : availableSpotsCount,
    availabilityLabel: isSproutPlan ? "" : availabilityLabel,
    images: isSproutPlan ? [] : images,
    photos: isSproutPlan ? [] : photos,
    virtualTourEmbedUrls: isSproutPlan ? [] : virtualTourEmbedUrls,
    reviews: isSproutPlan ? [] : reviews,
    faqs: isSproutPlan ? [] : faqs,
    directoryBadges: isSproutPlan ? [] : directoryBadges,
  }
}
