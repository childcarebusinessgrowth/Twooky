import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>

/**
 * Resolve provider profile id (profiles.id of the provider) by provider_slug.
 */
export async function getProviderProfileIdBySlug(
  supabase: TypedClient,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("profile_id")
    .eq("provider_slug", slug)
    .maybeSingle()
  if (error || !data) return null
  return data.profile_id
}

/**
 * Check if the parent has favorited this provider.
 */
export async function isFavorited(
  supabase: TypedClient,
  parentProfileId: string,
  providerProfileId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("parent_favorites")
    .select("id")
    .eq("parent_profile_id", parentProfileId)
    .eq("provider_profile_id", providerProfileId)
    .maybeSingle()
  return !error && data != null
}

/**
 * Add a favorite. Idempotent (unique constraint handles duplicate).
 */
export async function addFavorite(
  supabase: TypedClient,
  parentProfileId: string,
  providerProfileId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("parent_favorites").insert({
    parent_profile_id: parentProfileId,
    provider_profile_id: providerProfileId,
  })
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Remove a favorite.
 */
export async function removeFavorite(
  supabase: TypedClient,
  parentProfileId: string,
  providerProfileId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("parent_favorites")
    .delete()
    .eq("parent_profile_id", parentProfileId)
    .eq("provider_profile_id", providerProfileId)
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Reviews for public display: by provider_profile_id, with parent display name.
 */
export type PublicReviewRow = {
  id: string
  parent_profile_id: string | null
  provider_profile_id: string
  rating: number
  review_text: string
  created_at: string
  parent_display_name: string | null
  provider_reply_text: string | null
  provider_replied_at: string | null
}

export async function getReviewsByProviderProfileId(
  supabase: TypedClient,
  providerProfileId: string
): Promise<PublicReviewRow[]> {
  const { data: rows, error } = await supabase
    .from("parent_reviews")
    .select("id, parent_profile_id, provider_profile_id, rating, review_text, created_at, provider_reply_text, provider_replied_at")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  const parentIds = [...new Set(rows.map((r) => r.parent_profile_id).filter((id): id is string => id != null))]
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", parentIds)
  const nameBy = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
  return rows.map((row) => ({
    id: row.id,
    parent_profile_id: row.parent_profile_id,
    provider_profile_id: row.provider_profile_id,
    rating: row.rating,
    review_text: row.review_text,
    created_at: row.created_at,
    parent_display_name: row.parent_profile_id == null ? "Anonymous" : (nameBy.get(row.parent_profile_id) ?? null),
    provider_reply_text: row.provider_reply_text ?? null,
    provider_replied_at: row.provider_replied_at ?? null,
  }))
}

/**
 * Reviews written by a parent (for dashboard), with provider business name/slug.
 */
export type ParentReviewRow = {
  id: string
  provider_profile_id: string
  rating: number
  review_text: string
  created_at: string
  updated_at: string
  provider_business_name: string | null
  provider_slug: string | null
}

export async function getReviewsByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string
): Promise<ParentReviewRow[]> {
  const { data: rows, error } = await supabase
    .from("parent_reviews")
    .select("id, provider_profile_id, rating, review_text, created_at, updated_at")
    .eq("parent_profile_id", parentProfileId)
    .order("created_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  const providerIds = [...new Set(rows.map((r) => r.provider_profile_id))]
  const { data: providerProfiles } = await supabase
    .from("provider_profiles")
    .select("profile_id, business_name, provider_slug")
    .in("profile_id", providerIds)
  const infoBy = new Map(
    (providerProfiles ?? []).map((p) => [p.profile_id, { business_name: p.business_name, provider_slug: p.provider_slug }])
  )
  return rows.map((row) => {
    const info = infoBy.get(row.provider_profile_id)
    return {
      id: row.id,
      provider_profile_id: row.provider_profile_id,
      rating: row.rating,
      review_text: row.review_text,
      created_at: row.created_at,
      updated_at: row.updated_at,
      provider_business_name: info?.business_name ?? null,
      provider_slug: info?.provider_slug ?? null,
    }
  })
}

/**
 * Create a review. One review per parent per provider (upsert or replace).
 */
export async function createReview(
  supabase: TypedClient,
  parentProfileId: string,
  providerProfileId: string,
  rating: number,
  reviewText: string
): Promise<{ error: string | null }> {
  const trimmed = reviewText.trim()
  if (trimmed.length === 0) return { error: "Review text is required." }
  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5." }
  const { error } = await supabase.from("parent_reviews").upsert(
    {
      parent_profile_id: parentProfileId,
      provider_profile_id: providerProfileId,
      rating,
      review_text: trimmed,
    },
    { onConflict: "parent_profile_id,provider_profile_id" }
  )
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Update a review (owner only).
 */
export async function updateReview(
  supabase: TypedClient,
  reviewId: string,
  parentProfileId: string,
  updates: { rating?: number; review_text?: string }
): Promise<{ error: string | null }> {
  if (updates.rating != null && (updates.rating < 1 || updates.rating > 5)) {
    return { error: "Rating must be between 1 and 5." }
  }
  const payload: { rating?: number; review_text?: string } = {}
  if (updates.rating != null) payload.rating = updates.rating
  if (updates.review_text != null) {
    const t = updates.review_text.trim()
    if (t.length === 0) return { error: "Review text is required." }
    payload.review_text = t
  }
  if (Object.keys(payload).length === 0) return { error: null }
  const { error } = await supabase
    .from("parent_reviews")
    .update(payload)
    .eq("id", reviewId)
    .eq("parent_profile_id", parentProfileId)
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Delete a review (owner only).
 */
export async function deleteReview(
  supabase: TypedClient,
  reviewId: string,
  parentProfileId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("parent_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("parent_profile_id", parentProfileId)
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Add or update provider reply on a review (provider only).
 */
export async function addProviderReply(
  supabase: TypedClient,
  reviewId: string,
  providerProfileId: string,
  replyText: string
): Promise<{ error: string | null }> {
  const trimmed = replyText.trim()
  if (trimmed.length === 0) return { error: "Reply text is required." }
  const { error } = await supabase
    .from("parent_reviews")
    .update({
      provider_reply_text: trimmed,
      provider_replied_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("provider_profile_id", providerProfileId)
  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Create a report for a review (provider reporting a parent's review).
 */
export async function createReviewReport(
  supabase: TypedClient,
  reviewId: string,
  reporterProfileId: string,
  reason: string,
  details?: string | null
): Promise<{ error: string | null }> {
  const trimmedReason = reason.trim()
  if (trimmedReason.length === 0) return { error: "Reason is required." }
  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_profile_id: reporterProfileId,
    reason: trimmedReason,
    details: details?.trim() || null,
  })
  if (error) return { error: error.message }
  return { error: null }
}

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

/**
 * Favorites for a parent (for dashboard saved page), with provider info.
 */
export type ParentFavoriteRow = {
  id: string
  provider_profile_id: string
  created_at: string
  provider_business_name: string | null
  provider_slug: string | null
  provider_primary_image_url: string | null
}

export type ParentCompareProviderRow = {
  providerProfileId: string
  name: string
  slug: string | null
  location: string
  rating: number
  reviewCount: number
  tuitionRange: string
  ageGroups: string
  curriculum: string
  hours: string
  languages: string
  imageUrl: string | null
}

function formatCompareTuitionRange(from: number | null, to: number | null): string {
  if (from == null && to == null) return "Contact for pricing"
  return `$${from ?? "-"} - $${to ?? "-"}`
}

function formatCompareHours(openingTime: string | null, closingTime: string | null): string {
  if (openingTime && closingTime) return `${openingTime} - ${closingTime}`
  if (openingTime) return `${openingTime} onward`
  if (closingTime) return `Until ${closingTime}`
  return "Contact for hours"
}

function formatCompareListText(values: string[] | null, fallback = "Not specified"): string {
  if (!values || values.length === 0) return fallback
  const clean = values.map((value) => value.trim()).filter(Boolean)
  return clean.length > 0 ? clean.join(", ") : fallback
}

function formatCompareLanguageText(languagesSpoken: string | null): string {
  if (!languagesSpoken) return "Not specified"
  const parts = languagesSpoken
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "Not specified"
}

/**
 * Compare-ready providers for parent dashboard/compare page.
 * Source of truth: saved favorites + active provider listings only.
 */
export async function getCompareProvidersByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string,
  baseUrl: string,
  options?: { limit?: number }
): Promise<ParentCompareProviderRow[]> {
  const { data: favoriteRows, error: favoritesError } = await supabase
    .from("parent_favorites")
    .select("provider_profile_id, created_at")
    .eq("parent_profile_id", parentProfileId)
    .order("created_at", { ascending: false })

  if (favoritesError || !favoriteRows || favoriteRows.length === 0) return []

  const limit = options?.limit
  const favoriteProviderIds =
    typeof limit === "number" && limit > 0
      ? favoriteRows.slice(0, limit).map((row) => row.provider_profile_id)
      : favoriteRows.map((row) => row.provider_profile_id)

  const providerIds = [...new Set(favoriteProviderIds)]
  if (providerIds.length === 0) return []

  const [profilesResult, photosResult, reviewsResult] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select(
        "profile_id, provider_slug, business_name, city, address, age_groups_served, curriculum_type, opening_time, closing_time, languages_spoken, monthly_tuition_from, monthly_tuition_to, listing_status"
      )
      .in("profile_id", providerIds)
      .eq("listing_status", "active"),
    supabase
      .from("provider_photos")
      .select("provider_profile_id, storage_path")
      .in("provider_profile_id", providerIds)
      .eq("is_primary", true),
    supabase
      .from("parent_reviews")
      .select("provider_profile_id, rating")
      .in("provider_profile_id", providerIds),
  ])

  const profiles = profilesResult.data ?? []
  if (profiles.length === 0) return []

  const primaryPhotoByProvider: Record<string, string> = {}
  ;(photosResult.data ?? []).forEach((row) => {
    primaryPhotoByProvider[row.provider_profile_id] = row.storage_path
  })

  const reviewStatsByProvider: Record<string, { count: number; sum: number }> = {}
  ;(reviewsResult.data ?? []).forEach((row) => {
    const current = reviewStatsByProvider[row.provider_profile_id] ?? { count: 0, sum: 0 }
    current.count += 1
    current.sum += row.rating
    reviewStatsByProvider[row.provider_profile_id] = current
  })

  const profileById = new Map(profiles.map((profile) => [profile.profile_id, profile]))
  const uniqueFavoriteOrder = [...new Set(favoriteProviderIds)]

  return uniqueFavoriteOrder
    .map((providerId) => {
      const profile = profileById.get(providerId)
      if (!profile) return null

      const stats = reviewStatsByProvider[providerId]
      const reviewCount = stats?.count ?? 0
      const rating = reviewCount > 0 ? stats.sum / reviewCount : 0
      const location = [profile.city, profile.address].filter(Boolean).join(", ") || "Not specified"
      const storagePath = primaryPhotoByProvider[providerId]
      const imageUrl = storagePath
        ? `${baseUrl}/storage/v1/object/public/provider-photos/${storagePath}`
        : null

      return {
        providerProfileId: providerId,
        name: profile.business_name?.trim() || "Provider",
        slug: profile.provider_slug ?? null,
        location,
        rating,
        reviewCount,
        tuitionRange: formatCompareTuitionRange(
          profile.monthly_tuition_from ?? null,
          profile.monthly_tuition_to ?? null
        ),
        ageGroups: formatCompareListText(profile.age_groups_served ?? null),
        curriculum: profile.curriculum_type?.trim() || "Not specified",
        hours: formatCompareHours(profile.opening_time ?? null, profile.closing_time ?? null),
        languages: formatCompareLanguageText(profile.languages_spoken ?? null),
        imageUrl,
      }
    })
    .filter((provider): provider is ParentCompareProviderRow => provider != null)
}

export async function getFavoritesByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string,
  baseUrl: string
): Promise<ParentFavoriteRow[]> {
  const { data: rows, error } = await supabase
    .from("parent_favorites")
    .select("id, provider_profile_id, created_at")
    .eq("parent_profile_id", parentProfileId)
    .order("created_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  const providerIds = [...new Set(rows.map((r) => r.provider_profile_id))]
  const [profilesResult, photosResult] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("profile_id, business_name, provider_slug")
      .in("profile_id", providerIds),
    supabase
      .from("provider_photos")
      .select("provider_profile_id, storage_path")
      .in("provider_profile_id", providerIds)
      .eq("is_primary", true),
  ])
  const providerProfiles = profilesResult.data ?? []
  const infoBy = new Map(
    providerProfiles.map((p) => [p.profile_id, { business_name: p.business_name, provider_slug: p.provider_slug }])
  )
  const primaryPhotoByProvider: Record<string, string> = {}
  ;(photosResult.data ?? []).forEach((row) => {
    primaryPhotoByProvider[row.provider_profile_id] = row.storage_path
  })
  return rows.map((row) => {
    const info = infoBy.get(row.provider_profile_id)
    const storagePath = primaryPhotoByProvider[row.provider_profile_id]
    const provider_primary_image_url = storagePath
      ? `${baseUrl}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${storagePath}`
      : null
    return {
      id: row.id,
      provider_profile_id: row.provider_profile_id,
      created_at: row.created_at,
      provider_business_name: info?.business_name ?? null,
      provider_slug: info?.provider_slug ?? null,
      provider_primary_image_url,
    }
  })
}

/**
 * Count of favorites for a parent.
 */
export async function getFavoriteCount(
  supabase: TypedClient,
  parentProfileId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("parent_favorites")
    .select("id", { count: "exact", head: true })
    .eq("parent_profile_id", parentProfileId)
  if (error) return 0
  return count ?? 0
}

/**
 * Count of reviews written by a parent.
 */
export async function getReviewCount(
  supabase: TypedClient,
  parentProfileId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("parent_reviews")
    .select("id", { count: "exact", head: true })
    .eq("parent_profile_id", parentProfileId)
  if (error) return 0
  return count ?? 0
}

/**
 * Count of inquiries sent by a parent (non-deleted only).
 */
export async function getInquiryCount(
  supabase: TypedClient,
  parentProfileId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("parent_profile_id", parentProfileId)
    .is("deleted_at", null)
  if (error) return 0
  return count ?? 0
}

/**
 * Preview row for a parent's inquiry (dashboard recent messages). Message body is encrypted;
 * use inquiry_subject or "Message sent" for preview.
 */
export type ParentInquiryPreviewRow = {
  id: string
  provider_profile_id: string
  inquiry_subject: string | null
  created_at: string
  updated_at: string
  provider_business_name: string | null
  provider_slug: string | null
}

/**
 * Recent inquiries sent by a parent (for dashboard), with provider business name/slug.
 * Does not decrypt message; use inquiry_subject or "Message sent" for display.
 */
export async function getRecentInquiriesByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string,
  limit: number
): Promise<ParentInquiryPreviewRow[]> {
  const { data: rows, error } = await supabase
    .from("inquiries")
    .select("id, provider_profile_id, inquiry_subject, created_at, updated_at")
    .eq("parent_profile_id", parentProfileId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit)
  if (error || !rows || rows.length === 0) return []
  const providerIds = [...new Set(rows.map((r) => r.provider_profile_id))]
  const { data: providerProfiles } = await supabase
    .from("provider_profiles")
    .select("profile_id, business_name, provider_slug")
    .in("profile_id", providerIds)
  const infoBy = new Map(
    (providerProfiles ?? []).map((p) => [p.profile_id, { business_name: p.business_name, provider_slug: p.provider_slug }])
  )
  return rows.map((row) => {
    const info = infoBy.get(row.provider_profile_id)
    return {
      id: row.id,
      provider_profile_id: row.provider_profile_id,
      inquiry_subject: row.inquiry_subject ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      provider_business_name: info?.business_name ?? null,
      provider_slug: info?.provider_slug ?? null,
    }
  })
}

/**
 * All inquiries for a parent (for My Inquiries page). Ordered by updated_at desc.
 */
export async function getInquiriesByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string
): Promise<ParentInquiryPreviewRow[]> {
  const { data: rows, error } = await supabase
    .from("inquiries")
    .select("id, provider_profile_id, inquiry_subject, created_at, updated_at")
    .eq("parent_profile_id", parentProfileId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  const providerIds = [...new Set(rows.map((r) => r.provider_profile_id))]
  const { data: providerProfiles } = await supabase
    .from("provider_profiles")
    .select("profile_id, business_name, provider_slug")
    .in("profile_id", providerIds)
  const infoBy = new Map(
    (providerProfiles ?? []).map((p) => [p.profile_id, { business_name: p.business_name, provider_slug: p.provider_slug }])
  )
  return rows.map((row) => {
    const info = infoBy.get(row.provider_profile_id)
    return {
      id: row.id,
      provider_profile_id: row.provider_profile_id,
      inquiry_subject: row.inquiry_subject ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      provider_business_name: info?.business_name ?? null,
      provider_slug: info?.provider_slug ?? null,
    }
  })
}

/**
 * Get existing inquiry id for (parent, provider) if any. Used to open existing thread when
 * parent lands with ?provider=slug.
 */
export async function getInquiryIdByParentAndProvider(
  supabase: TypedClient,
  parentProfileId: string,
  providerProfileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id")
    .eq("parent_profile_id", parentProfileId)
    .eq("provider_profile_id", providerProfileId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data.id
}

/**
 * Preview row for a provider's inquiry (inbox list). Ordered by updated_at desc.
 */
export type ProviderInquiryPreviewRow = {
  id: string
  parent_profile_id: string
  inquiry_subject: string | null
  created_at: string
  updated_at: string
  parent_display_name: string | null
  parent_email: string | null
  lead_status: string
}

export async function getInquiriesByProviderProfileId(
  supabase: TypedClient,
  providerProfileId: string
): Promise<ProviderInquiryPreviewRow[]> {
  void providerProfileId
  const { data: rows, error } = await supabase.rpc("get_provider_inquiry_previews")
  if (error || !rows || rows.length === 0) return []

  const filteredRows = rows.filter((row) => row != null && row.parent_profile_id != null)
  return filteredRows
    .filter((row) => row != null)
    .map((row) => ({
      id: row.id,
      parent_profile_id: row.parent_profile_id,
      inquiry_subject: row.inquiry_subject ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      parent_display_name: row.parent_display_name ?? null,
      parent_email: row.parent_email ?? null,
      lead_status: row.lead_status ?? "new",
    }))
}

/**
 * Guest (non-logged-in) inquiry preview for provider inbox. Ordered by created_at desc.
 */
export type GuestInquiryPreviewRow = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  message_preview: string | null
}

export async function getGuestInquiriesByProviderProfileId(
  supabase: TypedClient,
  providerProfileId: string
): Promise<GuestInquiryPreviewRow[]> {
  const { data: rows, error } = await supabase
    .from("guest_inquiries")
    .select("id, created_at, first_name, last_name")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    first_name: row.first_name,
    last_name: row.last_name,
    message_preview: null,
  }))
}
