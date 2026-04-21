"use server"

import { createHash, randomBytes } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { deleteProviderPhotoStorage } from "@/lib/provider-photo-storage"
import { getSiteOrigin } from "@/lib/email/brand"
import { sendProviderEmailChangeConfirmationEmail } from "@/lib/email/providerEmailChange"

export type ProviderEmailChangeConfirmationResult =
  | { ok: true }
  | { ok: false; error: string; status?: "invalid" | "expired" | "used" }

const EMAIL_CHANGE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function hashEmailChangeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function buildEmailChangeConfirmationLink(token: string): string {
  const url = new URL("/confirm-email-change", getSiteOrigin())
  url.searchParams.set("token", token)
  return url.toString()
}

export async function requestProviderEmailChange(input: {
  newEmail: string
}): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }

  const currentEmail = normalizeEmail(user.email ?? "")
  if (!currentEmail) {
    return { error: "Missing account email. Please sign in again and retry." }
  }

  const requestedEmail = normalizeEmail(input.newEmail)
  if (!requestedEmail || !isValidEmail(requestedEmail)) {
    return { error: "Please enter a valid email address." }
  }

  if (requestedEmail === currentEmail) {
    return { error: "Please enter a different email address." }
  }

  const admin = getSupabaseAdminClient()
  const profilesTable = admin.from("profiles" as never) as any
  const pendingEmailChangesTable = admin.from("pending_email_changes" as never) as any

  const { data: profile, error: profileError } = await profilesTable
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError) return { error: profileError.message }
  if (!profile || profile.role !== "provider") {
    return { error: "Provider account not found." }
  }

  const { data: existingProfile, error: existingEmailError } = await profilesTable
    .select("id")
    .eq("email", requestedEmail)
    .maybeSingle()
  if (existingEmailError) return { error: existingEmailError.message }
  if (existingProfile && existingProfile.id !== user.id) {
    return { error: "This email is already in use." }
  }

  const token = randomBytes(32).toString("hex")
  const tokenHash = hashEmailChangeToken(token)
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS).toISOString()

  await pendingEmailChangesTable
    .delete()
    .eq("profile_id", user.id)
    .is("used_at", null)

  const { error: insertError } = await pendingEmailChangesTable.insert({
    profile_id: user.id,
    current_email: currentEmail,
    requested_email: requestedEmail,
    token_hash: tokenHash,
    expires_at: expiresAt,
  } as never)
  if (insertError) return { error: insertError.message }

  const sendResult = await sendProviderEmailChangeConfirmationEmail({
    to: currentEmail,
    currentEmail,
    requestedEmail,
    confirmationLink: buildEmailChangeConfirmationLink(token),
  })
  if (!sendResult) {
    await pendingEmailChangesTable.delete().eq("token_hash", tokenHash)
    return { error: "Unable to send confirmation email right now. Please try again later." }
  }

  return {}
}

export async function confirmProviderEmailChange(token: string): Promise<ProviderEmailChangeConfirmationResult> {
  const cleanToken = token.trim()
  if (!cleanToken) {
    return { ok: false, error: "Missing confirmation token.", status: "invalid" }
  }

  const admin = getSupabaseAdminClient()
  const pendingEmailChangesTable = admin.from("pending_email_changes" as never) as any
  const profilesTable = admin.from("profiles" as never) as any
  const tokenHash = hashEmailChangeToken(cleanToken)
  const { data: requestRow, error: fetchError } = await pendingEmailChangesTable
    .select("id, profile_id, current_email, requested_email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message, status: "invalid" }
  }

  if (!requestRow) {
    return {
      ok: false,
      error: "This confirmation link is invalid or has already been used.",
      status: "invalid",
    }
  }

  if (requestRow.used_at) {
    return {
      ok: false,
      error: "This confirmation link has already been used.",
      status: "used",
    }
  }

  if (new Date(requestRow.expires_at).getTime() < Date.now()) {
    await pendingEmailChangesTable.delete().eq("id", requestRow.id)
    return {
      ok: false,
      error: "This confirmation link has expired.",
      status: "expired",
    }
  }

  const claimTime = new Date().toISOString()
  const { data: claimedRow, error: claimError } = await pendingEmailChangesTable
    .update({ used_at: claimTime } as never)
    .eq("id", requestRow.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle()

  if (claimError) {
    return { ok: false, error: claimError.message, status: "invalid" }
  }

  if (!claimedRow) {
    return {
      ok: false,
      error: "This confirmation link has already been used.",
      status: "used",
    }
  }

  const { data: profile, error: profileError } = await profilesTable
    .select("id, role, email")
    .eq("id", requestRow.profile_id)
    .maybeSingle()
  if (profileError) {
    return { ok: false, error: profileError.message, status: "invalid" }
  }
  if (!profile || profile.role !== "provider") {
    return { ok: false, error: "Provider account not found.", status: "invalid" }
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(requestRow.profile_id, {
    email: requestRow.requested_email,
    email_confirm: true,
  })
  if (authUpdateError) {
    return { ok: false, error: authUpdateError.message, status: "invalid" }
  }

  const { error: profileUpdateError } = await admin
    .from("profiles" as never)
    .update({ email: requestRow.requested_email } as never)
    .eq("id", requestRow.profile_id)

  if (profileUpdateError) {
    const { error: rollbackError } = await admin.auth.admin.updateUserById(requestRow.profile_id, {
      email: requestRow.current_email,
      email_confirm: true,
    })
    if (rollbackError) {
      return {
        ok: false,
        error: `${profileUpdateError.message} Also failed to roll back auth email: ${rollbackError.message}`,
        status: "invalid",
      }
    }
    return { ok: false, error: profileUpdateError.message, status: "invalid" }
  }

  return { ok: true }
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
