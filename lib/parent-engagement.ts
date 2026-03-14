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
  parent_profile_id: string
  provider_profile_id: string
  rating: number
  review_text: string
  created_at: string
  parent_display_name: string | null
}

export async function getReviewsByProviderProfileId(
  supabase: TypedClient,
  providerProfileId: string
): Promise<PublicReviewRow[]> {
  const { data: rows, error } = await supabase
    .from("parent_reviews")
    .select("id, parent_profile_id, provider_profile_id, rating, review_text, created_at")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false })
  if (error || !rows || rows.length === 0) return []
  const parentIds = [...new Set(rows.map((r) => r.parent_profile_id))]
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
    parent_display_name: nameBy.get(row.parent_profile_id) ?? null,
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
 * Favorites for a parent (for dashboard saved page), with provider info.
 */
export type ParentFavoriteRow = {
  id: string
  provider_profile_id: string
  created_at: string
  provider_business_name: string | null
  provider_slug: string | null
}

export async function getFavoritesByParentProfileId(
  supabase: TypedClient,
  parentProfileId: string
): Promise<ParentFavoriteRow[]> {
  const { data: rows, error } = await supabase
    .from("parent_favorites")
    .select("id, provider_profile_id, created_at")
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
      created_at: row.created_at,
      provider_business_name: info?.business_name ?? null,
      provider_slug: info?.provider_slug ?? null,
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
