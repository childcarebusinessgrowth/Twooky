"use server"

import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { deleteProviderPhotoStorage } from "@/lib/provider-photo-storage"

export type ProviderNotificationPrefs = {
  notify_new_inquiries: boolean
  notify_new_reviews: boolean
  notify_weekly_analytics: boolean
}

export async function getProviderNotificationPrefs(): Promise<
  { data: ProviderNotificationPrefs | null; error?: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { data: null, error: userError?.message ?? "Not authenticated" }
  }
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("notify_new_inquiries, notify_new_reviews, notify_weekly_analytics")
    .eq("profile_id", user.id)
    .maybeSingle()
  if (error) {
    return { data: null, error: error.message }
  }
  if (!data) {
    return {
      data: {
        notify_new_inquiries: true,
        notify_new_reviews: true,
        notify_weekly_analytics: true,
      },
      error: undefined,
    }
  }
  return {
    data: {
      notify_new_inquiries: data.notify_new_inquiries ?? true,
      notify_new_reviews: data.notify_new_reviews ?? true,
      notify_weekly_analytics: data.notify_weekly_analytics ?? true,
    },
    error: undefined,
  }
}

export async function updateNotificationPrefs(
  prefs: ProviderNotificationPrefs
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }
  const { error } = await supabase
    .from("provider_profiles")
    .update({
      notify_new_inquiries: prefs.notify_new_inquiries,
      notify_new_reviews: prefs.notify_new_reviews,
      notify_weekly_analytics: prefs.notify_weekly_analytics,
    })
    .eq("profile_id", user.id)
  if (error) return { error: error.message }
  return {}
}

export async function deactivateListing(): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }
  const { error } = await supabase
    .from("provider_profiles")
    .update({ listing_status: "inactive" })
    .eq("profile_id", user.id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteProviderAccount(): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }

  const admin = getSupabaseAdminClient()

  // Best-effort: remove external storage objects first.
  try {
    await deleteProviderPhotoStorage(user.id)
  } catch {
    // Continue; DB cleanup still proceeds.
  }

  // Ensure provider-owned rows are removed even though provider_profiles.profile_id is intentionally decoupled
  // from profiles/auth (to allow admin-managed listings). Deleting provider_profiles cascades to related rows.
  const { error: providerProfileDeleteError } = await admin.from("provider_profiles").delete().eq("profile_id", user.id)
  if (providerProfileDeleteError) return { error: providerProfileDeleteError.message }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }
  return {}
}
