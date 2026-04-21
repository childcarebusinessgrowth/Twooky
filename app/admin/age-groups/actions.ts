"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type AgeGroupInput = {
  ageRange: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_AGE_GROUPS_PATH = "/admin/age-groups"

function normalizeSortOrder(sortOrder?: number) {
  if (sortOrder === undefined) return undefined
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be a whole number.")
  }
  return sortOrder
}

export async function createAgeGroup(input: AgeGroupInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const normalizedAgeRange = input.ageRange.trim()
  const normalizedSortOrder = normalizeSortOrder(input.sortOrder)
  if (!normalizedAgeRange) {
    throw new Error("Age range is required.")
  }
  const derivedTag = normalizedAgeRange.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  const values = {
    tag: derivedTag || `age_group_${Date.now()}`,
    age_range: normalizedAgeRange,
    is_active: input.isActive ?? true,
    ...(normalizedSortOrder !== undefined ? { sort_order: normalizedSortOrder } : {}),
  }
  const { error } = await supabase.from("age_groups").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateAgeGroup(id: string, input: AgeGroupInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const normalizedAgeRange = input.ageRange.trim()
  const normalizedSortOrder = normalizeSortOrder(input.sortOrder)
  if (!normalizedAgeRange) {
    throw new Error("Age range is required.")
  }
  const values = {
    age_range: normalizedAgeRange,
    is_active: input.isActive ?? true,
    ...(normalizedSortOrder !== undefined ? { sort_order: normalizedSortOrder } : {}),
  }
  const { error } = await supabase
    .from("age_groups")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteAgeGroup(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("age_groups").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
