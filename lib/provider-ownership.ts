import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>

/**
 * Resolves the provider profile id the authenticated provider should manage.
 * Falls back to the user's own profile id for legacy self-owned listings.
 */
export async function resolveOwnedProviderProfileId(
  supabase: TypedClient,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("profile_id")
    .eq("owner_profile_id", userId)
    .limit(1)
    .maybeSingle()

  if (!error && data?.profile_id) return data.profile_id
  return userId
}

/**
 * Returns the managed provider profile id first, followed by the user's own
 * profile id when different so callers can support legacy self-owned rows
 * during claimed-profile migrations.
 */
export async function resolveOwnedProviderProfileIds(
  supabase: TypedClient,
  userId: string
): Promise<string[]> {
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, userId)
  return providerProfileId === userId ? [userId] : [providerProfileId, userId]
}
