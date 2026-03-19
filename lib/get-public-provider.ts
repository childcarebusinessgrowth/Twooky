import type { SupabaseClient } from "@supabase/supabase-js"
import { parseYouTubeUrl } from "@/lib/youtube"
import { fetchGooglePlaceReviewSummary } from "@/lib/google-place-reviews"
import { formatDailyFeeRange } from "@/lib/currency"
import {
  getReviewsByProviderProfileId,
  type PublicReviewRow,
} from "@/lib/parent-engagement"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

export type PublicAvailabilityStatus = "openings" | "waitlist" | "full"

export type PublicProviderView = {
  profileId: string
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
  programTypes: string[]
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
}

const AVAILABILITY_LABELS: Record<PublicAvailabilityStatus, string> = {
  openings: "Spots Available",
  waitlist: "Waitlist",
  full: "Full",
}

function normalizeAvailabilityStatus(value: unknown): PublicAvailabilityStatus {
  if (value === "waitlist" || value === "full") return value
  return "openings"
}

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/1648377/pexels-photo-1648377.jpeg?auto=compress&cs=tinysrgb&w=800"

export async function getActivePublicProviderBySlug(
  supabase: SupabaseClient,
  slug: string,
  baseUrl: string
): Promise<PublicProviderView | null> {
  const slugTrimmed = slug.trim()
  if (!slugTrimmed) return null

  const { data: profile, error: profileError } = await supabase
    .from("provider_profiles")
    .select(
      "profile_id, provider_slug, business_name, description, address, phone, website, google_place_id, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, currency_id, currencies(symbol, code), virtual_tour_url, virtual_tour_urls, is_admin_managed, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, availability_status, available_spots_count"
    )
    .ilike("provider_slug", slugTrimmed)
    .eq("listing_status", "active")
    .maybeSingle()

  if (profileError || !profile) return null

  const profileId = profile.profile_id

  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const [photosResult, reviews, faqsResult, googleReviewSummary] = await Promise.all([
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
    fetchGooglePlaceReviewSummary(profile.google_place_id, googleApiKey),
  ])

  const photoRows = photosResult.data ?? []
  const photos = photoRows.map((row) => ({
    id: row.id,
    url: `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${row.storage_path}`,
    caption: row.caption,
  }))
  const images = photos.map((p) => p.url)
  const image = images[0] ?? PLACEHOLDER_IMAGE

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
  const displayReviewCount = googleReviewSummary?.reviewCount ?? platformReviewCount
  const displayRating = googleReviewSummary?.rating ?? platformRating
  const googleReviewsUrl = googleReviewSummary?.reviewsUrl ?? null

  const faqs = (faqsResult.data ?? []).map((row) => ({
    question: row.question,
    answer: row.answer,
  }))
  const availabilityStatus = normalizeAvailabilityStatus(profile.availability_status)
  const availableSpotsCount = profile.available_spots_count ?? null
  const availabilityLabel =
    availabilityStatus === "openings" && availableSpotsCount != null && availableSpotsCount > 0
      ? `Spots Available (${availableSpotsCount})`
      : AVAILABILITY_LABELS[availabilityStatus]

  return {
    profileId,
    slug: profile.provider_slug ?? slug,
    name: profile.business_name ?? "Provider",
    image,
    address: profile.address ?? "",
    platformRating,
    platformReviewCount,
    displayRating,
    displayReviewCount,
    googleReviewsUrl,
    rating: displayRating,
    reviewCount: displayReviewCount,
    providerTypes: profile.provider_types ?? [],
    programTypes: profile.provider_types ?? [],
    description: profile.description ?? "",
    ageGroups: profile.age_groups_served ?? [],
    hours,
    languages,
    curriculumTypes: Array.isArray(profile.curriculum_type) ? profile.curriculum_type : profile.curriculum_type ? [profile.curriculum_type] : [],
    website: profile.website ?? "",
    phone: profile.phone ?? "",
    priceRange,
    currencySymbol,
    currencyCode,
    registrationFee,
    depositFee,
    mealsFee,
    additionalServices,
    mealsIncluded,
    outdoorSpace,
    specialNeeds,
    inquiriesEnabled: !profile.is_admin_managed,
    earlyLearningExcellenceBadge: profile.early_learning_excellence_badge ?? false,
    verifiedProviderBadge: profile.verified_provider_badge ?? false,
    verifiedProviderBadgeColor: profile.verified_provider_badge_color ?? "emerald",
    availabilityStatus,
    availableSpotsCount,
    availabilityLabel,
    images,
    photos,
    virtualTourEmbedUrls,
    reviews,
    faqs,
  }
}
