"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"
import { deleteProviderPhotoStorage } from "@/lib/provider-photo-storage"
import { startPerfTimer } from "@/lib/perf-metrics"
import { shouldAutoGrantVerifiedBadgeOnApproval } from "@/lib/provider-plan-access"
import {
  getProviderProgramTypesByProfileIds,
  type ProviderProgramType,
} from "@/lib/provider-program-types"
import { getProviderTypesByProfileIds } from "@/lib/provider-taxonomy"
import {
  extractDirectoryBadgeRelation,
  toDirectoryBadgeView,
  type DirectoryBadgeRelationRow,
  type DirectoryBadgeView,
} from "@/lib/directory-badges"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"
const PROVIDER_DOCUMENTS_BUCKET = "provider-documents"
const SIGNED_URL_EXPIRY_SECONDS = 3600
const LISTINGS_PATH = "/admin/listings"
const DEFAULT_PAGE_SIZE = 10
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
let providerPhotosBucketReadyPromise: Promise<void> | null = null

export type ListingStatus = "active" | "pending" | "inactive"

export type AdminListingRow = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  phone: string | null
  city: string | null
  address: string | null
  listing_status: string
  featured: boolean
  early_learning_excellence_badge: boolean
  verified_provider_badge: boolean
  verified_provider_badge_color: string | null
  created_at: string
  review_count: number
  rating: number | null
  primary_photo_url: string | null
  directory_badges: DirectoryBadgeView[]
}

const VERIFIED_BADGE_COLORS = [
  "emerald",
  "blue",
  "purple",
  "rose",
  "amber",
] as const

type VerifiedBadgeColor = (typeof VERIFIED_BADGE_COLORS)[number]

function normalizeVerifiedBadgeColor(color: string | null | undefined): VerifiedBadgeColor {
  if (color && VERIFIED_BADGE_COLORS.includes(color as VerifiedBadgeColor)) {
    return color as VerifiedBadgeColor
  }
  return "emerald"
}

const MAX_IDS_FOR_FILTER = 2000

function sanitizeSearchTermForFilter(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
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

export type GetAdminListingsOptions = {
  page?: number
  pageSize?: number
  status?: ListingStatus | "all"
  search?: string
  countryId?: string
  featured?: "all" | "yes" | "no"
  minRating?: number
  minReviews?: number
  reviewsFilter?: "all" | "none"
}

export type AdminListingCountry = { id: string; name: string }

export async function getActiveDirectoryBadges(): Promise<DirectoryBadgeView[]> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("directory_badges")
    .select("id, name, description, color, icon")
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (error) return []
  return (data ?? []).map((badge) => toDirectoryBadgeView(badge))
}

type ProviderBadgeRow = {
  provider_profile_id: string
  directory_badges: DirectoryBadgeRelationRow[] | DirectoryBadgeRelationRow | null
}

export async function getAdminListings(
  options: GetAdminListingsOptions = {}
): Promise<{ listings: AdminListingRow[]; total: number }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("getAdminListings", { page: options.page ?? 1 })
  const page = Math.max(1, options.page ?? 1)
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const useRatingReviewsFilter =
    options.minRating != null ||
    options.minReviews != null ||
    options.reviewsFilter === "none"

  const selectOpts = useRatingReviewsFilter ? {} : { count: "exact" as const }
  let query = supabase
    .from("provider_profiles")
    .select("profile_id, provider_slug, business_name, phone, city, address, listing_status, featured, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, created_at", selectOpts)
    .order("created_at", { ascending: false })

  if (options.status && options.status !== "all") {
    query = query.eq("listing_status", options.status)
  }
  if (options.search?.trim()) {
    const q = sanitizeSearchTermForFilter(options.search)
    if (q) {
      query = query.or(`business_name.ilike.%${q}%,provider_slug.ilike.%${q}%`)
    }
  }
  if (options.countryId?.trim()) {
    query = query.eq("country_id", options.countryId.trim())
  }
  if (options.featured === "yes") {
    query = query.eq("featured", true)
  } else if (options.featured === "no") {
    query = query.eq("featured", false)
  }

  let profileIds: string[]
  let allRows: { profile_id: string; provider_slug: string | null; business_name: string | null; phone: string | null; city: string | null; address: string | null; listing_status: string; featured: boolean; early_learning_excellence_badge: boolean; verified_provider_badge: boolean; verified_provider_badge_color: string | null; created_at: string }[]

  if (useRatingReviewsFilter) {
    const { data: allData, error } = await query.limit(MAX_IDS_FOR_FILTER)
    if (error) throw new Error(error.message)
    allRows = allData ?? []
    profileIds = allRows.map((r) => r.profile_id)
  } else {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data: rows, count, error } = await query.range(from, to)
    if (error) throw new Error(error.message)
    perf.mark("loaded_listing_page_rows", { rows: rows?.length ?? 0 })
    allRows = rows ?? []
    profileIds = allRows.map((r) => r.profile_id)
    const total = count ?? 0
    if (profileIds.length === 0) {
      return { listings: [], total }
    }
    const [reviewsResult, photosResult, providerBadgesResult] = await Promise.all([
      supabase.from("parent_reviews").select("provider_profile_id, rating").in("provider_profile_id", profileIds),
      supabase.from("provider_photos").select("provider_profile_id, storage_path").in("provider_profile_id", profileIds).eq("is_primary", true),
      supabase
        .from("provider_profile_badges")
        .select("provider_profile_id, directory_badges(id, name, description, color, icon)")
        .in("provider_profile_id", profileIds),
    ])
    const reviewCountByProfile: Record<string, { count: number; sum: number }> = {}
    for (const id of profileIds) reviewCountByProfile[id] = { count: 0, sum: 0 }
    for (const r of reviewsResult.data ?? []) {
      const cur = reviewCountByProfile[r.provider_profile_id]
      if (cur) { cur.count += 1; cur.sum += r.rating }
    }
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    const primaryPhotoByProfile: Record<string, string> = {}
    const badgesByProfile: Record<string, DirectoryBadgeView[]> = {}
    for (const p of photosResult.data ?? []) {
      if (!primaryPhotoByProfile[p.provider_profile_id])
        primaryPhotoByProfile[p.provider_profile_id] = `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${p.storage_path}`
    }
    for (const row of (providerBadgesResult.data ?? []) as ProviderBadgeRow[]) {
      const relationBadge = extractDirectoryBadgeRelation(row.directory_badges)
      if (!relationBadge) continue
      if (!badgesByProfile[row.provider_profile_id]) {
        badgesByProfile[row.provider_profile_id] = []
      }
      badgesByProfile[row.provider_profile_id].push(toDirectoryBadgeView(relationBadge))
    }
    const listings: AdminListingRow[] = allRows.map((row) => {
      const rev = reviewCountByProfile[row.profile_id]
      const reviewCount = rev?.count ?? 0
      const rating = reviewCount > 0 && rev ? Math.round((rev.sum / reviewCount) * 10) / 10 : null
      return {
        ...row,
        listing_status: row.listing_status ?? "pending",
        featured: row.featured ?? false,
        early_learning_excellence_badge: row.early_learning_excellence_badge ?? false,
        verified_provider_badge: row.verified_provider_badge ?? false,
        verified_provider_badge_color: normalizeVerifiedBadgeColor(row.verified_provider_badge_color),
        review_count: reviewCount,
        rating,
        primary_photo_url: primaryPhotoByProfile[row.profile_id] ?? null,
        directory_badges: badgesByProfile[row.profile_id] ?? [],
      }
    })
    perf.end({ total })
    return { listings, total }
  }

  if (profileIds.length === 0) return { listings: [], total: 0 }

  const { data: reviewsData } = await supabase
    .from("parent_reviews")
    .select("provider_profile_id, rating")
    .in("provider_profile_id", profileIds)

  const reviewCountByProfile: Record<string, { count: number; sum: number }> = {}
  for (const id of profileIds) reviewCountByProfile[id] = { count: 0, sum: 0 }
  for (const r of reviewsData ?? []) {
    const cur = reviewCountByProfile[r.provider_profile_id]
    if (cur) { cur.count += 1; cur.sum += r.rating }
  }

  const filteredIds = profileIds.filter((id) => {
    const rev = reviewCountByProfile[id]
    const count = rev?.count ?? 0
    const avgRating = count > 0 && rev ? rev.sum / count : null
    if (options.reviewsFilter === "none") return count === 0
    if (options.minReviews != null && count < options.minReviews) return false
    if (options.minRating != null) {
      if (count === 0 || avgRating == null) return false
      return avgRating >= options.minRating
    }
    return true
  })

  const total = filteredIds.length
  const idsForPage = filteredIds.slice((page - 1) * pageSize, page * pageSize)
  if (idsForPage.length === 0) return { listings: [], total }

  const rowsForPage = allRows.filter((r) => idsForPage.includes(r.profile_id))
  const rowById = new Map(rowsForPage.map((r) => [r.profile_id, r] as const))
  const orderedRows = idsForPage
    .map((id) => rowById.get(id))
    .filter((row): row is (typeof allRows)[number] => row != null)

  const [photosResult, providerBadgesResult] = await Promise.all([
    supabase.from("provider_photos").select("provider_profile_id, storage_path").in("provider_profile_id", idsForPage).eq("is_primary", true),
    supabase
      .from("provider_profile_badges")
      .select("provider_profile_id, directory_badges(id, name, description, color, icon)")
      .in("provider_profile_id", idsForPage),
  ])
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const primaryPhotoByProfile: Record<string, string> = {}
  const badgesByProfile: Record<string, DirectoryBadgeView[]> = {}
  for (const p of photosResult.data ?? []) {
    if (!primaryPhotoByProfile[p.provider_profile_id])
      primaryPhotoByProfile[p.provider_profile_id] = `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${p.storage_path}`
  }
  for (const row of (providerBadgesResult.data ?? []) as ProviderBadgeRow[]) {
    const relationBadge = extractDirectoryBadgeRelation(row.directory_badges)
    if (!relationBadge) continue
    if (!badgesByProfile[row.provider_profile_id]) {
      badgesByProfile[row.provider_profile_id] = []
    }
    badgesByProfile[row.provider_profile_id].push(toDirectoryBadgeView(relationBadge))
  }

  const listings: AdminListingRow[] = orderedRows.map((row) => {
    const rev = reviewCountByProfile[row.profile_id]
    const reviewCount = rev?.count ?? 0
    const rating = reviewCount > 0 && rev ? Math.round((rev.sum / reviewCount) * 10) / 10 : null
    return {
      ...row,
      listing_status: row.listing_status ?? "pending",
      featured: row.featured ?? false,
      early_learning_excellence_badge: row.early_learning_excellence_badge ?? false,
      verified_provider_badge: row.verified_provider_badge ?? false,
      verified_provider_badge_color: normalizeVerifiedBadgeColor(row.verified_provider_badge_color),
      review_count: reviewCount,
      rating,
      primary_photo_url: primaryPhotoByProfile[row.profile_id] ?? null,
      directory_badges: badgesByProfile[row.profile_id] ?? [],
    }
  })

  perf.end({ total })
  return { listings, total }
}

export type AdminListingDetailPhoto = {
  id: string
  url: string
  caption: string | null
  is_primary: boolean
  sort_order: number
}

export type AdminListingDetailFaq = {
  question: string
  answer: string
}

export type AdminListingDetailDocument = {
  id: string
  document_type: string
  signed_url: string | null
  file_size: number
}

export type AdminListingDetail = {
  profile: {
    profile_id: string
    provider_slug: string | null
    business_name: string | null
    phone: string | null
    city: string | null
    address: string | null
    website: string | null
    google_place_id: string | null
    description: string | null
    provider_types: string[] | null
    age_groups_served: string[] | null
    curriculum_type: string[] | null
    languages_spoken: string | null
    amenities: string[] | null
    opening_time: string | null
    closing_time: string | null
    monthly_tuition_from: number | null
    monthly_tuition_to: number | null
    daily_fee_from: number | null
    daily_fee_to: number | null
    registration_fee: number | null
    deposit_fee: number | null
    meals_fee: number | null
    service_transport: boolean
    service_extended_hours: boolean
    service_pickup_dropoff: boolean
    service_extracurriculars: boolean
    total_capacity: number | null
    currency_id: string | null
    country_id: string | null
    city_id: string | null
    country_name: string | null
    city_name: string | null
    virtual_tour_url: string | null
    virtual_tour_urls: string[] | null
    listing_status: string
    featured: boolean
    early_learning_excellence_badge: boolean
    verified_provider_badge: boolean
    verified_provider_badge_color: string | null
    created_at: string
  }
  assignedBadges: DirectoryBadgeView[]
  programTypes: ProviderProgramType[]
  photos: AdminListingDetailPhoto[]
  faqs: AdminListingDetailFaq[]
  documents: AdminListingDetailDocument[]
}

export async function getAdminListingDetail(
  profileId: string
): Promise<AdminListingDetail | null> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("getAdminListingDetail", { profile_id: profileId })
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

  const { data: profile, error: profileError } = await supabase
    .from("provider_profiles")
    .select(
      "profile_id, provider_slug, business_name, phone, city, address, website, google_place_id, description, provider_types, age_groups_served, curriculum_type, languages_spoken, amenities, opening_time, closing_time, monthly_tuition_from, monthly_tuition_to, daily_fee_from, daily_fee_to, registration_fee, deposit_fee, meals_fee, service_transport, service_extended_hours, service_pickup_dropoff, service_extracurriculars, total_capacity, currency_id, currencies(symbol), country_id, city_id, virtual_tour_url, virtual_tour_urls, listing_status, featured, early_learning_excellence_badge, verified_provider_badge, verified_provider_badge_color, created_at"
    )
    .eq("profile_id", profileId)
    .single()

  if (profileError || !profile) {
    return null
  }
  perf.mark("loaded_profile")

  const [{ data: countryRow }, { data: cityRow }] = await Promise.all([
    profile.country_id
      ? supabase
          .from("countries")
          .select("name")
          .eq("id", profile.country_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profile.city_id
      ? supabase
          .from("cities")
          .select("name")
          .eq("id", profile.city_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const [
    { data: photoRows },
    { data: faqRows },
    { data: docRows },
    { data: providerBadgeRows },
    programTypesByProfile,
    providerTypesByProfile,
  ] = await Promise.all([
    supabase
      .from("provider_photos")
      .select("id, storage_path, caption, is_primary, sort_order")
      .eq("provider_profile_id", profileId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("provider_faqs")
      .select("question, answer")
      .eq("provider_profile_id", profileId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("provider_listing_documents")
      .select("id, document_type, storage_path, file_size")
      .eq("provider_profile_id", profileId)
      .order("uploaded_at", { ascending: true }),
    supabase
      .from("provider_profile_badges")
      .select("provider_profile_id, directory_badges(id, name, description, color, icon)")
      .eq("provider_profile_id", profileId),
    getProviderProgramTypesByProfileIds(supabase, [profileId]),
    getProviderTypesByProfileIds(supabase, [profileId]),
  ])

  const docPaths = (docRows ?? []).map((d) => d.storage_path)
  const { data: signedBatch } =
    docPaths.length > 0
      ? await supabase.storage
          .from(PROVIDER_DOCUMENTS_BUCKET)
          .createSignedUrls(docPaths, SIGNED_URL_EXPIRY_SECONDS)
      : { data: [] as Array<{ path?: string; signedUrl?: string | null }> }
  const signedByPath = new Map<string, string | null>(
    (signedBatch ?? []).map((entry) => [entry.path ?? "", entry.signedUrl ?? null])
  )
  const documents: AdminListingDetailDocument[] = (docRows ?? []).map((d) => ({
    id: d.id,
    document_type: d.document_type,
    signed_url: signedByPath.get(d.storage_path) ?? null,
    file_size: d.file_size,
  }))
  perf.mark("loaded_photos_faq_docs", {
    photo_count: photoRows?.length ?? 0,
    faq_count: faqRows?.length ?? 0,
    doc_count: docRows?.length ?? 0,
  })

  const photos: AdminListingDetailPhoto[] = (photoRows ?? []).map((row) => ({
    id: row.id,
    url: `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${row.storage_path}`,
    caption: row.caption,
    is_primary: row.is_primary,
    sort_order: row.sort_order,
  }))

  const faqs: AdminListingDetailFaq[] = (faqRows ?? []).map((row) => ({
    question: row.question ?? "",
    answer: row.answer ?? "",
  }))

  perf.end()
  return {
    profile: {
      ...profile,
      provider_types: providerTypesByProfile[profileId]?.map((item) => item.slug) ?? profile.provider_types,
      country_name: countryRow?.name ?? null,
      city_name: cityRow?.name ?? null,
      listing_status: profile.listing_status ?? "pending",
      featured: profile.featured ?? false,
      early_learning_excellence_badge: profile.early_learning_excellence_badge ?? false,
      verified_provider_badge: profile.verified_provider_badge ?? false,
      verified_provider_badge_color: normalizeVerifiedBadgeColor(profile.verified_provider_badge_color),
    },
    assignedBadges: ((providerBadgeRows ?? []) as ProviderBadgeRow[])
      .map((row) => extractDirectoryBadgeRelation(row.directory_badges))
      .filter((badge): badge is DirectoryBadgeRelationRow => badge !== null)
      .map((badge) => toDirectoryBadgeView(badge)),
    programTypes: programTypesByProfile[profileId] ?? [],
    photos,
    faqs,
    documents,
  }
}

export async function updateListingStatus(
  profileId: string,
  status: ListingStatus
): Promise<{ error?: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const { data: before } = await supabase
    .from("provider_profiles")
    .select("listing_status, plan_id")
    .eq("profile_id", profileId)
    .maybeSingle()
  const previousStatus = before?.listing_status ?? "pending"
  const shouldVerify =
    status === "active" &&
    (previousStatus === "pending" || previousStatus === "draft") &&
    shouldAutoGrantVerifiedBadgeOnApproval(before?.plan_id)
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({
      listing_status: status,
      ...(shouldVerify ? { verified_provider_badge: true } : {}),
    })
    .eq("profile_id", profileId)
    .select("provider_slug")
    .maybeSingle()
  if (error) return { error: error.message }
  if (status === "active") {
    await supabase.from("provider_notifications").insert({
      provider_profile_id: profileId,
      type: "listing_confirmed",
      title: "Your listing is live",
      message: "Your provider profile has been approved and is now visible on the directory.",
      href: "/dashboard/provider",
    })
  }
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/dashboard/provider/listing")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
  return {}
}

export async function updateListingFeatured(
  profileId: string,
  featured: boolean
): Promise<{ error?: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({ featured })
    .eq("profile_id", profileId)
    .select("provider_slug")
    .maybeSingle()
  if (error) return { error: error.message }
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/dashboard/provider/listing")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
  return {}
}

export async function updateListingEarlyLearningExcellenceBadge(
  profileId: string,
  earlyLearningExcellenceBadge: boolean
): Promise<{ error?: string }> {
  await assertAdminPermission("badges.verify")
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({ early_learning_excellence_badge: earlyLearningExcellenceBadge })
    .eq("profile_id", profileId)
    .select("provider_slug")
    .maybeSingle()
  if (error) return { error: error.message }
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
  return {}
}

export async function updateListingVerifiedProviderBadge(
  profileId: string,
  verifiedProviderBadge: boolean
): Promise<{ error?: string }> {
  await assertAdminPermission("badges.verify")
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({ verified_provider_badge: verifiedProviderBadge })
    .eq("profile_id", profileId)
    .select("provider_slug")
    .maybeSingle()
  if (error) return { error: error.message }
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
  return {}
}

export async function updateListingVerifiedProviderBadgeColor(
  profileId: string,
  badgeColor: string
): Promise<{ error?: string }> {
  await assertAdminPermission("badges.verify")
  const supabase = getSupabaseAdminClient()
  const normalizedColor = normalizeVerifiedBadgeColor(badgeColor)
  const { data, error } = await supabase
    .from("provider_profiles")
    .update({ verified_provider_badge_color: normalizedColor })
    .eq("profile_id", profileId)
    .select("provider_slug")
    .maybeSingle()
  if (error) return { error: error.message }
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
  return {}
}

export async function deleteListingPhoto(
  profileId: string,
  photoId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()

  const { data: photoRow, error: selectError } = await supabase
    .from("provider_photos")
    .select("id, storage_path, is_primary")
    .eq("id", photoId)
    .eq("provider_profile_id", profileId)
    .maybeSingle()

  if (selectError) return { ok: false, error: selectError.message }
  if (!photoRow) return { ok: false, error: "Photo not found." }

  const { error: deleteError } = await supabase
    .from("provider_photos")
    .delete()
    .eq("id", photoId)
    .eq("provider_profile_id", profileId)

  if (deleteError) return { ok: false, error: deleteError.message }

  if (photoRow.is_primary) {
    const { data: remaining } = await supabase
      .from("provider_photos")
      .select("id")
      .eq("provider_profile_id", profileId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    if (remaining) {
      await supabase
        .from("provider_photos")
        .update({ is_primary: true })
        .eq("id", remaining.id)
        .eq("provider_profile_id", profileId)
    }
  }

  try {
    await supabase.storage.from(PROVIDER_PHOTOS_BUCKET).remove([photoRow.storage_path])
  } catch {
    // Best-effort cleanup; row already deleted
  }

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()

  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (profile?.provider_slug) {
    revalidatePath(`/providers/${profile.provider_slug}`)
  }
  return { ok: true }
}

export async function setListingPrimaryPhoto(
  profileId: string,
  photoId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()

  const { data: targetPhoto, error: targetPhotoError } = await supabase
    .from("provider_photos")
    .select("id, is_primary")
    .eq("id", photoId)
    .eq("provider_profile_id", profileId)
    .maybeSingle()

  if (targetPhotoError) return { ok: false, error: targetPhotoError.message }
  if (!targetPhoto) return { ok: false, error: "Photo not found." }
  if (targetPhoto.is_primary) return { ok: true }

  const { data: currentPrimary, error: currentPrimaryError } = await supabase
    .from("provider_photos")
    .select("id")
    .eq("provider_profile_id", profileId)
    .eq("is_primary", true)
    .maybeSingle()
  if (currentPrimaryError) return { ok: false, error: currentPrimaryError.message }

  const { error: unsetError } = await supabase
    .from("provider_photos")
    .update({ is_primary: false })
    .eq("provider_profile_id", profileId)
  if (unsetError) return { ok: false, error: unsetError.message }

  const { error: setError } = await supabase
    .from("provider_photos")
    .update({ is_primary: true })
    .eq("id", photoId)
    .eq("provider_profile_id", profileId)
  if (setError) {
    if (currentPrimary?.id) {
      await supabase
        .from("provider_photos")
        .update({ is_primary: true })
        .eq("id", currentPrimary.id)
        .eq("provider_profile_id", profileId)
    }
    return { ok: false, error: setError.message }
  }

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()

  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/dashboard/provider/photos")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (profile?.provider_slug) {
    revalidatePath(`/providers/${profile.provider_slug}`)
  }

  return { ok: true }
}

export async function deleteListing(profileId: string): Promise<{ error?: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("deleteListing", { profile_id: profileId })
  try {
    await deleteProviderPhotoStorage(profileId)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete provider photos from storage" }
  }
  perf.mark("deleted_photo_storage")
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .maybeSingle()
  if (profile?.role === "provider") {
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(profileId)
    if (deleteUserError) {
      return { error: deleteUserError.message }
    }
  }
  const { error } = await supabase
    .from("provider_profiles")
    .delete()
    .eq("profile_id", profileId)
  if (error) return { error: error.message }
  perf.mark("deleted_provider_profile")
  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  perf.end({ ok: true })
  return {}
}

export async function addListingPhotos(
  profileId: string,
  formData: FormData
): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const perf = startPerfTimer("addListingPhotos", { profile_id: profileId })

  const photos = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (photos.length === 0) {
    return { ok: false, error: "Please select at least one photo." }
  }

  for (const photo of photos) {
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return { ok: false, error: "Only PNG, JPG, and WebP photos are supported." }
    }
    if (photo.size > MAX_IMAGE_SIZE_BYTES) {
      return { ok: false, error: "Each photo must be 10MB or less." }
    }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("provider_profiles")
    .select("profile_id")
    .eq("profile_id", profileId)
    .maybeSingle()
  if (profileError) return { ok: false, error: profileError.message }
  if (!profileRow) return { ok: false, error: "Listing not found." }

  const { data: existingPhotos, error: existingPhotosError } = await supabase
    .from("provider_photos")
    .select("id, is_primary, sort_order")
    .eq("provider_profile_id", profileId)
  if (existingPhotosError) return { ok: false, error: existingPhotosError.message }

  const hasPrimary = (existingPhotos ?? []).some((row) => row.is_primary)
  const maxSortOrder = (existingPhotos ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? -1), -1)
  let nextSortOrder = maxSortOrder + 1

  const uploadedPaths: string[] = []

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
        caption: null,
        is_primary: !hasPrimary && i === 0,
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

  const { data: profileAfter } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()

  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/dashboard/provider/photos")
  revalidatePath("/search")
  revalidateProviderDirectoryCaches()
  if (profileAfter?.provider_slug) {
    revalidatePath(`/providers/${profileAfter.provider_slug}`)
  }
  perf.end({ ok: true, added: photos.length })
  return { ok: true, added: photos.length }
}

/** Returns countries from the database (directory's countries table) for the location filter. */
export async function getAdminListingCountries(): Promise<AdminListingCountry[]> {
  await assertAdminPermission("listings.manage")
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("countries")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (error) return []
  return (data ?? []).map((r) => ({ id: r.id, name: r.name })).filter((c) => c.name)
}

export async function setListingDirectoryBadges(
  profileId: string,
  badgeIds: string[],
): Promise<{ error?: string }> {
  await assertAdminPermission("badges.verify")
  const supabase = getSupabaseAdminClient()

  const dedupedBadgeIds = Array.from(new Set(badgeIds.filter(Boolean)))
  const { error: deleteError } = await supabase
    .from("provider_profile_badges")
    .delete()
    .eq("provider_profile_id", profileId)
  if (deleteError) return { error: deleteError.message }

  if (dedupedBadgeIds.length > 0) {
    const { error: insertError } = await supabase.from("provider_profile_badges").insert(
      dedupedBadgeIds.map((badgeId) => ({
        provider_profile_id: profileId,
        badge_id: badgeId,
      })),
    )
    if (insertError) return { error: insertError.message }
  }

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()

  revalidatePath(LISTINGS_PATH)
  revalidatePath(`${LISTINGS_PATH}/${profileId}`)
  revalidatePath("/dashboard/provider")
  revalidatePath("/search")
  revalidatePath("/")
  revalidateProviderDirectoryCaches()
  if (profile?.provider_slug) {
    revalidatePath(`/providers/${profile.provider_slug}`)
  }

  return {}
}
