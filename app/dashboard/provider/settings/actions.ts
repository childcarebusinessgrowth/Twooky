"use server"

import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
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
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("notify_new_inquiries, notify_new_reviews, notify_weekly_analytics")
    .eq("profile_id", providerProfileId)
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
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
  const { error } = await supabase
    .from("provider_profiles")
    .update({
      notify_new_inquiries: prefs.notify_new_inquiries,
      notify_new_reviews: prefs.notify_new_reviews,
      notify_weekly_analytics: prefs.notify_weekly_analytics,
    })
    .eq("profile_id", providerProfileId)
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
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
  const { error } = await supabase
    .from("provider_profiles")
    .update({ listing_status: "inactive" })
    .eq("profile_id", providerProfileId)
  if (error) return { error: error.message }
  return {}
}

export async function updateProviderPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }

  if (!user.email) {
    return { error: "Missing account email. Please sign in again and retry." }
  }

  if (!input.currentPassword || !input.newPassword) {
    return { error: "Please provide your current and new password." }
  }

  if (input.newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long." }
  }

  if (input.currentPassword === input.newPassword) {
    return { error: "New password must be different from your current password." }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  })
  if (signInError) {
    return { error: "Current password is incorrect." }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  })
  if (updateError) {
    return { error: updateError.message }
  }

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
  const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)

  const admin = getSupabaseAdminClient()

  // Best-effort: remove external storage objects first.
  try {
    await deleteProviderPhotoStorage(providerProfileId)
  } catch {
    // Continue; DB cleanup still proceeds.
  }

  // Ensure provider-owned rows are removed even though provider_profiles.profile_id is intentionally decoupled
  // from profiles/auth (to allow admin-managed listings). Deleting provider_profiles cascades to related rows.
  const { error: providerProfileDeleteError } = await admin
    .from("provider_profiles")
    .delete()
    .eq("profile_id", providerProfileId)
  if (providerProfileDeleteError) return { error: providerProfileDeleteError.message }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }
  return {}
}
