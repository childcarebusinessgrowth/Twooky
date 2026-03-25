import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"

export type DeleteCascadeCounts = {
  provider_profiles: number
  provider_photos: number
  inquiries_as_provider: number
  parent_favorites_as_provider: number
  parent_reviews_as_provider: number
  provider_notifications: number
  inquiries_as_parent: number
  parent_favorites_as_parent: number
  parent_reviews_as_parent: number
  review_reports_as_reporter: number
}

async function countRows<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  filter: { column: string; value: string }
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*", { count: "exact", head: true } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq(filter.column as any, filter.value as any)
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Helper to verify cascade-deletion coverage for a given profile id.
 * Intended for admin/service-role usage.
 */
export async function getDeleteCascadeCounts(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<DeleteCascadeCounts> {
  const [
    provider_profiles,
    provider_photos,
    inquiries_as_provider,
    parent_favorites_as_provider,
    parent_reviews_as_provider,
    provider_notifications,
    inquiries_as_parent,
    parent_favorites_as_parent,
    parent_reviews_as_parent,
    review_reports_as_reporter,
  ] = await Promise.all([
    countRows(supabase, "provider_profiles", { column: "profile_id", value: profileId }),
    countRows(supabase, "provider_photos", { column: "provider_profile_id", value: profileId }),
    countRows(supabase, "inquiries", { column: "provider_profile_id", value: profileId }),
    countRows(supabase, "parent_favorites", { column: "provider_profile_id", value: profileId }),
    countRows(supabase, "parent_reviews", { column: "provider_profile_id", value: profileId }),
    countRows(supabase, "provider_notifications", { column: "provider_profile_id", value: profileId }),
    countRows(supabase, "inquiries", { column: "parent_profile_id", value: profileId }),
    countRows(supabase, "parent_favorites", { column: "parent_profile_id", value: profileId }),
    countRows(supabase, "parent_reviews", { column: "parent_profile_id", value: profileId }),
    countRows(supabase, "review_reports", { column: "reporter_profile_id", value: profileId }),
  ])

  return {
    provider_profiles,
    provider_photos,
    inquiries_as_provider,
    parent_favorites_as_provider,
    parent_reviews_as_provider,
    provider_notifications,
    inquiries_as_parent,
    parent_favorites_as_parent,
    parent_reviews_as_parent,
    review_reports_as_reporter,
  }
}

