"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

const ADMIN_PARENTS_PATH = "/admin/parents"

export type ParentActionResult = { ok: true } | { ok: false; error: string }

export async function activateParent(profileId: string): Promise<ParentActionResult> {
  try {
    await assertServerRole("admin")
  } catch {
    return { ok: false, error: "Unauthorized" }
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ is_active: true })
    .eq("id", profileId)
    .eq("role", "parent")

  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath(ADMIN_PARENTS_PATH)
  return { ok: true }
}

export async function deactivateParent(profileId: string): Promise<ParentActionResult> {
  try {
    await assertServerRole("admin")
  } catch {
    return { ok: false, error: "Unauthorized" }
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", profileId)
    .eq("role", "parent")

  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath(ADMIN_PARENTS_PATH)
  return { ok: true }
}

export async function deleteParent(profileId: string): Promise<ParentActionResult> {
  try {
    await assertServerRole("admin")
  } catch {
    return { ok: false, error: "Unauthorized" }
  }

  const admin = getSupabaseAdminClient()
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", profileId)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }
  if (!profile) {
    return { ok: false, error: "Parent profile not found." }
  }
  if (profile.role !== "parent") {
    return { ok: false, error: "Only parent accounts can be deleted from this page." }
  }

  // deleteUser removes the auth user; profiles.id references auth.users(id) on delete cascade,
  // so the profile and all parent-related data (parent_profiles, favorites, inquiries, etc.) cascade delete.
  const { error } = await admin.auth.admin.deleteUser(profileId)
  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath(ADMIN_PARENTS_PATH)
  return { ok: true }
}
